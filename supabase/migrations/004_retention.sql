-- ==========================================================================
-- TOKYO HOUSE — ล้างข้อมูลยอดขาย/การเงินทุกรอบ 65 วัน
-- วางไฟล์นี้ใน SQL Editor แล้ว Run (รันซ้ำได้ · schema.sql มีส่วนนี้ครบแล้วสำหรับติดตั้งใหม่)
--
--   • รอบแรกเริ่มวันที่รันไฟล์นี้ (เวลาไทย) · ครบ 65 วัน → ลบ แล้วเริ่มรอบใหม่ทันที
--   • สิ่งที่ลบ: บิลที่ปิดแล้ว (ชำระ/ยกเลิก) + ออเดอร์ในบิลนั้น, รายจ่ายทั้งหมด, การเรียกพนักงานที่จัดการแล้ว
--   • ไม่ลบ: บิลที่ยังไม่ชำระ, เมนู, โต๊ะ, หมวดรายจ่าย, บัญชีพนักงาน
--   • ลบเงียบ ๆ ไม่มีแจ้งเตือน — ถ้าต้องการเก็บ ให้กดปุ่ม CSV ในหน้ายอดขาย/การเงินเอง
-- ==========================================================================

create table if not exists public.retention_state (
  id            int primary key default 1 check (id = 1),     -- มีแถวเดียว
  cycle_start   date not null default (now() at time zone 'Asia/Bangkok')::date,
  last_purge_at timestamptz,
  last_purged   jsonb
);
insert into public.retention_state (id) values (1) on conflict (id) do nothing;

alter table public.retention_state enable row level security;
drop policy if exists "staff read" on public.retention_state;
create policy "staff read" on public.retention_state
  for select to authenticated using (public.is_staff());

-- ตรวจรอบ + ลบเมื่อครบกำหนด แล้วคืนสถานะรอบปัจจุบัน
-- เรียกได้จาก pg_cron (ทุกคืน) และจากหน้าพนักงาน (สำรอง เผื่อ pg_cron ไม่ได้เปิด)
create or replace function public.run_retention()
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  s        public.retention_state%rowtype;
  v_today  date := (now() at time zone 'Asia/Bangkok')::date;
  v_cycles int;
  v_bills  int := 0;
  v_exp    int := 0;
  v_calls  int := 0;
begin
  -- ผู้ใช้ที่ล็อกอินต้องเป็นพนักงาน (pg_cron รันเป็นเจ้าของฐานข้อมูล ไม่มี auth.uid())
  if auth.uid() is not null and not public.is_staff() then raise exception 'NOT_AUTHORIZED'; end if;

  insert into public.retention_state (id) values (1) on conflict (id) do nothing;
  select * into s from public.retention_state where id = 1 for update;

  v_cycles := (v_today - s.cycle_start) / 65;
  if v_cycles >= 1 then
    delete from public.bills where status <> 'open';            -- ออเดอร์ลบตาม (on delete cascade)
    get diagnostics v_bills = row_count;
    delete from public.expenses;
    get diagnostics v_exp = row_count;
    delete from public.staff_calls where status = 'done';
    get diagnostics v_calls = row_count;

    -- เลื่อนรอบตามปฏิทินเดิม (ถ้าไม่มีใครเปิดระบบนานเกินรอบ ก็ยังตรงรอบ)
    update public.retention_state
       set cycle_start = s.cycle_start + v_cycles * 65,
           last_purge_at = now(),
           last_purged = jsonb_build_object('bills', v_bills, 'expenses', v_exp, 'calls', v_calls)
     where id = 1
    returning * into s;
  end if;

  return jsonb_build_object(
    'cycle_start', s.cycle_start,
    'purge_on', s.cycle_start + 65,
    'days_left', (s.cycle_start + 65) - v_today,
    'last_purge_at', s.last_purge_at,
    'last_purged', s.last_purged);
end;
$$;

revoke all on function public.run_retention() from public, anon;
grant execute on function public.run_retention() to authenticated;

-- ลบตรงเวลาทุกคืน 00:05 น. (เวลาไทย = 17:05 UTC) ด้วย pg_cron
-- ถ้าเปิด pg_cron ไม่ได้ ระบบยังลบให้ตอนพนักงานเปิดหน้าพนักงานครั้งแรกหลังครบกำหนด
do $$
begin
  create extension if not exists pg_cron;
  perform cron.schedule('tokyo-house-retention', '5 17 * * *', 'select public.run_retention()');
exception when others then
  raise notice 'pg_cron ใช้ไม่ได้ (%): ระบบจะลบตอนพนักงานเปิดหน้าพนักงานแทน', sqlerrm;
end $$;
