-- ==========================================================================
-- TOKYO HOUSE — Supabase schema (v3)
-- รันทั้งไฟล์ใน Supabase Dashboard > SQL Editor (รันซ้ำได้ ไม่ทำข้อมูลหาย)
--
-- หลักการความปลอดภัย
--   • ลูกค้า (anon) อ่านได้เฉพาะเมนู และเรียกได้เฉพาะฟังก์ชัน RPC ที่กำหนด
--     ไม่สามารถอ่าน/แก้ตารางบิล ออเดอร์ โต๊ะ หรือการเรียกพนักงานโดยตรง
--   • ราคาคำนวณจากตาราง menu_items ในฐานข้อมูลเสมอ (แก้ราคาจากเครื่องลูกค้าไม่ได้)
--   • สั่งอาหารได้ต้องมี token ลับของโต๊ะ (อยู่ใน QR) — เดาเลขโต๊ะเพื่อสั่งแทนไม่ได้
--   • 1 โต๊ะมีบิลที่ยังไม่ชำระได้ 1 ใบ → สแกนสั่งเพิ่มกี่รอบก็รวมเป็นบิลเดียว
--   • ไม่มีการชำระเงินออนไลน์ — ปิดบิลได้เฉพาะพนักงานที่ล็อกอิน (close_bill)
--   • พนักงาน = ผู้ใช้ Supabase Auth ที่อยู่ในตาราง staff_members เท่านั้น
-- ==========================================================================

-- --------------------------------------------------------------------------
-- (ทางเลือก) ถ้าเคยรัน schema เวอร์ชันแรกมาก่อน ให้เอาคอมเมนต์ 2 บรรทัดนี้ออกแล้วรันก่อน
-- ⚠️ จะลบออเดอร์เดิมทั้งหมด
-- drop table if exists public.orders cascade;
-- drop policy if exists "menu write" on public.menu_items;
-- --------------------------------------------------------------------------

create extension if not exists pgcrypto;

-- ============================== TABLES ====================================

create table if not exists public.staff_members (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.menu_items (
  id         text primary key,
  code       text not null,
  name       text not null check (char_length(name) between 1 and 80),
  filling    text,                                   -- ไส้: หวาน/คาว
  category   text,
  price      numeric(10,2) not null default 0 check (price >= 0 and price <= 100000),
  available  boolean not null default true,
  image      text,
  created_at timestamptz not null default now()
);

create table if not exists public.dining_tables (
  id          text primary key,                      -- '1', '2', … , 'takeaway'
  label       text not null check (char_length(label) between 1 and 40),
  is_takeaway boolean not null default false,
  token       text not null unique default encode(gen_random_bytes(12), 'hex'),
  active      boolean not null default true,
  sort        int not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists public.bills (
  id             uuid primary key default gen_random_uuid(),
  table_id       text not null references public.dining_tables (id),
  table_label    text not null,
  is_takeaway    boolean not null default false,
  status         text not null default 'open' check (status in ('open', 'paid', 'cancelled')),
  total          numeric(12,2) not null default 0,
  payment_method text check (payment_method in ('cash', 'transfer')),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  paid_at        timestamptz,
  closed_by      uuid references auth.users (id)
);

-- กฎหลัก: โต๊ะนั่งทานมีบิลเปิดได้ใบเดียว
create unique index if not exists bills_one_open_per_table
  on public.bills (table_id) where status = 'open' and not is_takeaway;
create index if not exists bills_status_updated_idx on public.bills (status, updated_at desc);

create table if not exists public.orders (
  id         uuid primary key default gen_random_uuid(),
  bill_id    uuid not null references public.bills (id) on delete cascade,
  round      int not null default 1,
  items      jsonb not null default '[]'::jsonb,     -- [{menu_id,name,price,qty}]
  total      numeric(12,2) not null default 0,
  note       text check (note is null or char_length(note) <= 200),
  status     text not null default 'รับออเดอร์'
             check (status in ('รับออเดอร์', 'กำลังทำ', 'เสิร์ฟแล้ว', 'ยกเลิก')),
  client_key text unique,                             -- กันส่งออเดอร์ซ้ำ
  created_at timestamptz not null default now()
);
create index if not exists orders_bill_idx on public.orders (bill_id, round);
create index if not exists orders_created_idx on public.orders (created_at desc);

create table if not exists public.staff_calls (
  id             uuid primary key default gen_random_uuid(),
  table_id       text not null references public.dining_tables (id),
  table_label    text not null,
  reason         text not null check (reason in ('call', 'bill', 'help')),
  status         text not null default 'pending' check (status in ('pending', 'done')),
  repeat_count   int not null default 1,
  created_at     timestamptz not null default now(),
  last_called_at timestamptz not null default now(),
  handled_at     timestamptz
);
create index if not exists staff_calls_pending_idx on public.staff_calls (status, last_called_at desc);

-- หมวดรายจ่าย (พนักงานสร้าง/แก้ชื่อ/ลบเองได้ในหน้า "การเงิน & บัญชี")
create table if not exists public.expense_categories (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique check (char_length(name) between 1 and 40),
  sort       int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.expenses (
  id         uuid primary key default gen_random_uuid(),
  category   text,
  amount     numeric(12,2) not null default 0,
  spent_on   date not null default current_date,
  created_at timestamptz not null default now()
);
-- v3: รายจ่ายผูกกับหมวด + หมายเหตุ (รันซ้ำได้ — เพิ่มเฉพาะที่ยังไม่มี)
-- ลบหมวดที่ยังมีรายจ่ายอยู่ไม่ได้ (on delete restrict) กันตัวเลขย้อนหลังหายหมวด
alter table public.expenses alter column category drop not null;
alter table public.expenses add column if not exists category_id uuid
  references public.expense_categories (id) on delete restrict;
alter table public.expenses add column if not exists note text;
do $$
begin
  alter table public.expenses add constraint expenses_amount_range check (amount > 0 and amount <= 10000000);
exception when duplicate_object then null;
end $$;
do $$
begin
  alter table public.expenses add constraint expenses_note_length check (note is null or char_length(note) <= 200);
exception when duplicate_object then null;
end $$;
create index if not exists expenses_spent_on_idx on public.expenses (spent_on desc);
create index if not exists expenses_category_idx on public.expenses (category_id);

-- ============================== HELPERS ===================================

create or replace function public.is_staff()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.staff_members where user_id = auth.uid());
$$;

-- ยอดบิล = ผลรวมทุกรอบที่ไม่ถูกยกเลิก (คำนวณใหม่อัตโนมัติทุกครั้งที่ออเดอร์เปลี่ยน)
create or replace function public.recalc_bill_total()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_bill uuid := coalesce(new.bill_id, old.bill_id);
begin
  update public.bills b
     set total = coalesce((select sum(o.total) from public.orders o
                            where o.bill_id = v_bill and o.status <> 'ยกเลิก'), 0),
         updated_at = now()
   where b.id = v_bill;
  return null;
end;
$$;

drop trigger if exists orders_recalc_bill on public.orders;
create trigger orders_recalc_bill
  after insert or update or delete on public.orders
  for each row execute function public.recalc_bill_total();

-- กันแก้ข้อมูลสำคัญของบิลที่ปิดแล้ว (เช่น เปลี่ยนยอดหลังรับเงิน)
create or replace function public.guard_closed_bill()
returns trigger
language plpgsql set search_path = public
as $$
begin
  if old.status <> 'open' and (new.status is distinct from old.status
       or new.payment_method is distinct from old.payment_method) then
    raise exception 'BILL_NOT_OPEN';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists bills_guard_closed on public.bills;
create trigger bills_guard_closed
  before update on public.bills
  for each row execute function public.guard_closed_bill();

-- ยกเลิกรอบ/แก้รายการในบิลที่ปิดแล้วไม่ได้ (กันยอดที่รับเงินแล้วเปลี่ยน) — เปลี่ยนสถานะครัวได้ตามปกติ
create or replace function public.guard_closed_bill_orders()
returns trigger
language plpgsql set search_path = public
as $$
begin
  if (new.status = 'ยกเลิก') is distinct from (old.status = 'ยกเลิก')
     or new.total is distinct from old.total
     or new.items is distinct from old.items
     or new.bill_id is distinct from old.bill_id then
    if exists (select 1 from public.bills where id = old.bill_id and status <> 'open') then
      raise exception 'BILL_NOT_OPEN';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists orders_guard_closed on public.orders;
create trigger orders_guard_closed
  before update on public.orders
  for each row execute function public.guard_closed_bill_orders();

-- ============================== CUSTOMER RPC ==============================

-- แปลง token ใน QR → ข้อมูลโต๊ะ
create or replace function public.get_table_info(p_token text)
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare
  t public.dining_tables%rowtype;
begin
  select * into t from public.dining_tables where token = p_token and active;
  if not found then raise exception 'INVALID_TABLE'; end if;
  return jsonb_build_object('id', t.id, 'label', t.label, 'is_takeaway', t.is_takeaway);
end;
$$;

-- สั่งอาหาร: ถ้าโต๊ะมีบิลที่ยังไม่ชำระ → เพิ่มเป็นรอบใหม่ในบิลเดิม, ถ้าไม่มี → เปิดบิลใหม่
create or replace function public.place_order(
  p_token      text,
  p_items      jsonb,
  p_note       text default null,
  p_bill_id    uuid default null,
  p_client_key text default null
)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  t        public.dining_tables%rowtype;
  b        public.bills%rowtype;
  o        public.orders%rowtype;
  m        public.menu_items%rowtype;
  v_line   jsonb;
  v_qty    int;
  v_items  jsonb := '[]'::jsonb;
  v_total  numeric := 0;
  v_round  int;
  v_recent int;
begin
  select * into t from public.dining_tables where token = p_token and active;
  if not found then raise exception 'INVALID_TABLE'; end if;

  -- ส่งซ้ำด้วย key เดิม → คืนผลเดิม ไม่สร้างออเดอร์ซ้ำ
  if p_client_key is not null then
    select * into o from public.orders where client_key = p_client_key;
    if found then
      select * into b from public.bills where id = o.bill_id;
      return jsonb_build_object('bill_id', b.id, 'order_id', o.id, 'round', o.round,
        'order_total', o.total, 'bill_total', b.total,
        'table_label', t.label, 'is_takeaway', t.is_takeaway);
    end if;
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'EMPTY_ORDER';
  end if;
  if jsonb_array_length(p_items) > 30 then raise exception 'TOO_MANY_ITEMS'; end if;
  if p_note is not null and char_length(p_note) > 200 then raise exception 'NOTE_TOO_LONG'; end if;

  -- ล็อกทีละโต๊ะ กันสองเครื่องสั่งพร้อมกันแล้วเปิดบิลซ้อน
  perform pg_advisory_xact_lock(hashtext('table:' || t.id));

  select count(*) into v_recent
    from public.orders x join public.bills y on y.id = x.bill_id
   where y.table_id = t.id and x.created_at > now() - interval '30 seconds';
  if v_recent >= 3 then raise exception 'RATE_LIMIT'; end if;

  for v_line in select value from jsonb_array_elements(p_items) loop
    if coalesce(v_line->>'qty', '') !~ '^[0-9]{1,2}$' then raise exception 'INVALID_QTY'; end if;
    v_qty := (v_line->>'qty')::int;
    if v_qty < 1 or v_qty > 20 then raise exception 'INVALID_QTY'; end if;

    select * into m from public.menu_items where id = v_line->>'menu_id';
    if not found or not m.available then
      raise exception 'ITEM_UNAVAILABLE:%', coalesce(m.name, v_line->>'menu_id', '?');
    end if;

    v_items := v_items || jsonb_build_array(jsonb_build_object(
      'menu_id', m.id, 'name', m.name, 'price', m.price, 'qty', v_qty));
    v_total := v_total + m.price * v_qty;
  end loop;

  if t.is_takeaway then
    if p_bill_id is not null then
      select * into b from public.bills
       where id = p_bill_id and table_id = t.id and status = 'open' for update;
    end if;
  else
    select * into b from public.bills
     where table_id = t.id and status = 'open' for update;
  end if;

  if b.id is null then
    insert into public.bills (table_id, table_label, is_takeaway)
    values (t.id, t.label, t.is_takeaway)
    returning * into b;
  end if;

  select coalesce(max(round), 0) + 1 into v_round from public.orders where bill_id = b.id;

  insert into public.orders (bill_id, round, items, total, note, client_key)
  values (b.id, v_round, v_items, v_total, nullif(btrim(p_note), ''), p_client_key)
  returning * into o;

  select * into b from public.bills where id = b.id;   -- ยอดใหม่จาก trigger

  return jsonb_build_object('bill_id', b.id, 'order_id', o.id, 'round', o.round,
    'order_total', o.total, 'bill_total', b.total,
    'table_label', t.label, 'is_takeaway', t.is_takeaway);
end;
$$;

-- ลูกค้าดูบิลของโต๊ะตัวเองเท่านั้น
create or replace function public.get_table_bill(p_token text, p_bill_id uuid default null)
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare
  t public.dining_tables%rowtype;
  b public.bills%rowtype;
begin
  select * into t from public.dining_tables where token = p_token and active;
  if not found then raise exception 'INVALID_TABLE'; end if;

  if t.is_takeaway then
    select * into b from public.bills where id = p_bill_id and table_id = t.id;
  else
    select * into b from public.bills where table_id = t.id and status = 'open';
  end if;

  if b.id is null then
    return jsonb_build_object('table_label', t.label, 'bill', null);
  end if;

  return jsonb_build_object(
    'table_label', t.label,
    'bill', jsonb_build_object(
      'id', b.id, 'table_label', b.table_label, 'status', b.status, 'total', b.total,
      'created_at', b.created_at, 'updated_at', b.updated_at, 'paid_at', b.paid_at,
      'orders', coalesce((
        select jsonb_agg(jsonb_build_object(
                 'id', o.id, 'round', o.round, 'items', o.items, 'total', o.total,
                 'note', o.note, 'status', o.status, 'created_at', o.created_at)
               order by o.round)
          from public.orders o where o.bill_id = b.id), '[]'::jsonb)));
end;
$$;

-- เรียกพนักงาน (กดซ้ำได้ทุก 60 วินาที; ถ้ายังไม่มีคนรับ จะนับเป็น "เรียกซ้ำ")
create or replace function public.call_staff(p_token text, p_reason text)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  t public.dining_tables%rowtype;
  c public.staff_calls%rowtype;
  v_since numeric;
begin
  if p_reason not in ('call', 'bill', 'help') then raise exception 'INVALID_REASON'; end if;

  select * into t from public.dining_tables where token = p_token and active;
  if not found then raise exception 'INVALID_TABLE'; end if;

  perform pg_advisory_xact_lock(hashtext('call:' || t.id));

  select * into c from public.staff_calls
   where table_id = t.id and reason = p_reason and status = 'pending'
   order by last_called_at desc limit 1;

  if found then
    v_since := extract(epoch from now() - c.last_called_at);
    if v_since < 60 then
      return jsonb_build_object('status', 'cooldown', 'retry_after', ceil(60 - v_since)::int);
    end if;
    update public.staff_calls
       set repeat_count = repeat_count + 1, last_called_at = now()
     where id = c.id;
    return jsonb_build_object('status', 'repeated', 'retry_after', 60);
  end if;

  insert into public.staff_calls (table_id, table_label, reason)
  values (t.id, t.label, p_reason);
  return jsonb_build_object('status', 'created', 'retry_after', 60);
end;
$$;

-- ============================== STAFF RPC =================================

-- รับชำระเงิน / ปิดบิล (เฉพาะพนักงาน)
create or replace function public.close_bill(p_bill_id uuid, p_method text)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  b public.bills%rowtype;
begin
  if not public.is_staff() then raise exception 'NOT_AUTHORIZED'; end if;
  if p_method not in ('cash', 'transfer') then raise exception 'INVALID_METHOD'; end if;

  select * into b from public.bills where id = p_bill_id for update;
  if not found or b.status <> 'open' then raise exception 'BILL_NOT_OPEN'; end if;

  update public.bills
     set status = 'paid', payment_method = p_method, paid_at = now(), closed_by = auth.uid()
   where id = p_bill_id
  returning * into b;

  update public.staff_calls
     set status = 'done', handled_at = now()
   where table_id = b.table_id and reason = 'bill' and status = 'pending';

  return to_jsonb(b);
end;
$$;

-- ============================== PERMISSIONS ===============================

revoke all on function public.close_bill(uuid, text) from public, anon;
grant execute on function public.close_bill(uuid, text) to authenticated;
revoke all on function public.recalc_bill_total() from public, anon, authenticated;

grant execute on function public.get_table_info(text) to anon, authenticated;
grant execute on function public.place_order(text, jsonb, text, uuid, text) to anon, authenticated;
grant execute on function public.get_table_bill(text, uuid) to anon, authenticated;
grant execute on function public.call_staff(text, text) to anon, authenticated;
grant execute on function public.is_staff() to anon, authenticated;

alter table public.staff_members enable row level security;
alter table public.menu_items    enable row level security;
alter table public.dining_tables enable row level security;
alter table public.bills         enable row level security;
alter table public.orders        enable row level security;
alter table public.staff_calls   enable row level security;
alter table public.expenses      enable row level security;
alter table public.expense_categories enable row level security;

-- ลบ policy เดโมเวอร์ชันแรก (ที่เปิดให้ทุกคนแก้ได้)
drop policy if exists "menu read"      on public.menu_items;
drop policy if exists "menu write"     on public.menu_items;
drop policy if exists "orders read"    on public.orders;
drop policy if exists "orders write"   on public.orders;
drop policy if exists "expenses read"  on public.expenses;
drop policy if exists "expenses write" on public.expenses;

drop policy if exists "staff see self" on public.staff_members;
create policy "staff see self" on public.staff_members
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "menu public read" on public.menu_items;
create policy "menu public read" on public.menu_items
  for select to anon, authenticated using (true);

drop policy if exists "menu staff insert" on public.menu_items;
create policy "menu staff insert" on public.menu_items
  for insert to authenticated with check (public.is_staff());
drop policy if exists "menu staff update" on public.menu_items;
create policy "menu staff update" on public.menu_items
  for update to authenticated using (public.is_staff()) with check (public.is_staff());
drop policy if exists "menu staff delete" on public.menu_items;
create policy "menu staff delete" on public.menu_items
  for delete to authenticated using (public.is_staff());

drop policy if exists "staff only" on public.dining_tables;
create policy "staff only" on public.dining_tables
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists "staff only" on public.bills;
create policy "staff only" on public.bills
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists "staff only" on public.orders;
create policy "staff only" on public.orders
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists "staff only" on public.staff_calls;
create policy "staff only" on public.staff_calls
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists "staff only" on public.expenses;
create policy "staff only" on public.expenses
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists "staff only" on public.expense_categories;
create policy "staff only" on public.expense_categories
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- ============================== STORAGE (รูปเมนู) ==========================
-- ทุกคนดูรูปได้ (bucket สาธารณะ) · อัปโหลด/ลบได้เฉพาะพนักงาน · จำกัด 2 MB และเฉพาะไฟล์รูป
-- (หน้าเว็บย่อรูปเหลือ ~100 KB ก่อนอัปโหลดอยู่แล้ว)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('menu-images', 'menu-images', true, 2097152, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "menu images staff upload" on storage.objects;
create policy "menu images staff upload" on storage.objects
  for insert to authenticated with check (bucket_id = 'menu-images' and public.is_staff());

drop policy if exists "menu images staff update" on storage.objects;
create policy "menu images staff update" on storage.objects
  for update to authenticated using (bucket_id = 'menu-images' and public.is_staff());

drop policy if exists "menu images staff delete" on storage.objects;
create policy "menu images staff delete" on storage.objects
  for delete to authenticated using (bucket_id = 'menu-images' and public.is_staff());

-- ============================== REALTIME ==================================
-- ให้หน้าแดชบอร์ดเห็นออเดอร์ใหม่/การเรียกพนักงานทันที (RLS ยังมีผล: เฉพาะพนักงาน)
do $$
begin
  begin alter publication supabase_realtime add table public.bills;       exception when others then null; end;
  begin alter publication supabase_realtime add table public.orders;      exception when others then null; end;
  begin alter publication supabase_realtime add table public.staff_calls; exception when others then null; end;
end $$;

-- ============================== RETENTION =================================
-- ล้างข้อมูลยอดขาย/การเงินทุกรอบ 65 วัน (ลบเงียบ ๆ ไม่มีแจ้งเตือน)
-- ลบ: บิลที่ปิดแล้ว + ออเดอร์, รายจ่าย, การเรียกพนักงานที่จัดการแล้ว · ไม่ลบ: บิลค้าง เมนู โต๊ะ หมวด พนักงาน
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

-- ============================== SEED ======================================

insert into public.dining_tables (id, label, is_takeaway, sort)
select n::text, 'โต๊ะที่ ' || lpad(n::text, 2, '0'), false, n
  from generate_series(1, 12) as n
on conflict (id) do nothing;

insert into public.dining_tables (id, label, is_takeaway, sort)
values ('takeaway', 'สั่งกลับบ้าน', true, 999)
on conflict (id) do nothing;

insert into public.menu_items (id, code, name, filling, category, price, available, image) values
  ('A1','A1','สังขยาใบเตย + บัตเตอร์คุกกี้','หวาน','ขนมโตเกียว',100,true,'/images/products/S__11141155_0.jpg'),
  ('A2','A2','ช็อกโกแลต + วิปครีม','หวาน','ขนมโตเกียว',100,true,'/images/products/S__11141156_0.jpg'),
  ('A3','A3','ไส้กรอก + ชีสยืด','คาว','ขนมโตเกียว',120,true,'/images/products/S__11141157_0.jpg'),
  ('A4','A4','แฮม + ไข่ + พริกไทย','คาว','ขนมโตเกียว',120,false,'/images/products/S__11141136_0.jpg'),
  ('A5','A5','หมูหยอง + น้ำสลัด','คาว','ขนมโตเกียว',110,true,'/images/products/S__11141158_0.jpg'),
  ('A6','A6','ครีมสด + สตรอว์เบอร์รี','หวาน','ขนมโตเกียว',110,true,'/images/products/S__11141160_0.jpg'),
  ('A7','A7','ไข่เค็ม + ลาวา','หวาน','ขนมโตเกียว',130,false,'/images/products/S__11141161_0.jpg'),
  ('A8','A8','นูเทลล่า + กล้วย','หวาน','ขนมโตเกียว',120,true,'/images/products/S__11141162_0.jpg'),
  ('A9','A9','ทูน่า + มายองเนส','คาว','ขนมโตเกียว',120,true,'/images/products/S__11141165_0.jpg'),
  ('A10','A10','มัทฉะ + ถั่วแดง','หวาน','ขนมโตเกียว',130,true,'/images/products/S__11141149_0.jpg'),
  ('A11','A11','เบคอน + ชีส + ไข่','คาว','ขนมโตเกียว',130,true,'/images/products/S__11141150_0.jpg'),
  ('A12','A12','ชาไทย + ไข่มุก','หวาน','เครื่องดื่ม',60,true,'/images/products/S__11141154_0.jpg')
on conflict (id) do nothing;

-- หมวดรายจ่ายเริ่มต้น (แก้ชื่อ/ลบ/เพิ่มได้ในหน้า "การเงิน & บัญชี")
insert into public.expense_categories (name, sort) values
  ('วัตถุดิบ', 1), ('บรรจุภัณฑ์', 2), ('ค่าแก๊ส', 3), ('ค่าไฟ', 4),
  ('ค่าน้ำ', 5), ('ค่าเช่า', 6), ('ค่าแรง', 7), ('อื่น ๆ', 99)
on conflict (name) do nothing;

-- ==========================================================================
-- เพิ่มพนักงาน: สร้างผู้ใช้ที่ Authentication > Users ก่อน แล้วรัน (เปลี่ยนอีเมล)
--   insert into public.staff_members (user_id, display_name)
--   select id, 'เจ้าของร้าน' from auth.users where email = 'owner@example.com'
--   on conflict do nothing;
-- ==========================================================================
