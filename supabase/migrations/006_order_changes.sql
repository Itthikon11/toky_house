-- ==========================================================================
-- TOKYO HOUSE — ลูกค้าขอยกเลิกรอบ (พนักงานอนุมัติ) + พนักงานลด/ลบเมนูในบิล
-- วางไฟล์นี้ใน SQL Editor แล้ว Run (รันซ้ำได้ · schema.sql มีส่วนนี้แล้วสำหรับติดตั้งใหม่)
-- ==========================================================================

-- ลูกค้าขอยกเลิกรอบที่ร้านยังไม่เริ่มทำ → พนักงานอนุมัติ (approved) / ไม่อนุมัติ (rejected)
alter table public.orders add column if not exists cancel_request text
  check (cancel_request in ('pending', 'approved', 'rejected'));

-- ลูกค้าขอยกเลิกรอบของโต๊ะตัวเอง: ได้เฉพาะรอบที่ยัง "รับออเดอร์" (ร้านยังไม่เริ่มทำ) และบิลยังไม่ปิด
-- ขอได้ครั้งเดียวต่อรอบ · ยกเลิกจริงเมื่อพนักงานอนุมัติเท่านั้น
create or replace function public.request_cancel_order(p_token text, p_order_id uuid, p_bill_id uuid default null)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  t public.dining_tables%rowtype;
  o public.orders%rowtype;
begin
  select * into t from public.dining_tables where token = p_token and active;
  if not found then raise exception 'INVALID_TABLE'; end if;

  select x.* into o
    from public.orders x join public.bills b on b.id = x.bill_id
   where x.id = p_order_id and b.table_id = t.id and b.status = 'open'
     and (not t.is_takeaway or b.id = p_bill_id)
     for update of x;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  if o.status <> 'รับออเดอร์' then raise exception 'CANCEL_TOO_LATE'; end if;
  if o.cancel_request = 'rejected' then raise exception 'CANCEL_REJECTED'; end if;

  if o.cancel_request is null then
    update public.orders set cancel_request = 'pending' where id = o.id;
  end if;
  return jsonb_build_object('status', 'pending');
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
                 'note', o.note, 'status', o.status, 'created_at', o.created_at,
                 'cancel_request', o.cancel_request)
               order by o.round)
          from public.orders o where o.bill_id = b.id), '[]'::jsonb)));
end;
$$;

grant execute on function public.request_cancel_order(text, uuid, uuid) to anon, authenticated;

-- พนักงานลดจำนวน / ลบเมนูออกจากรอบ (เช่น ลูกค้าไม่ได้รับของ) — เฉพาะบิลที่ยังไม่ชำระ
-- p_line = ลำดับรายการในรอบ (เริ่ม 0) · p_qty = จำนวนที่ลด (null = ลบทั้งรายการ)
-- ลบจนไม่เหลือรายการ → รอบนั้นกลายเป็น "ยกเลิก" (เก็บรายการเดิมไว้ดูย้อนหลัง)
create or replace function public.remove_order_item(p_order_id uuid, p_line int, p_qty int default null)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  o        public.orders%rowtype;
  v_status text;
  v_have   int;
  v_left   int;
  v_items  jsonb;
  v_total  numeric;
begin
  if not public.is_staff() then raise exception 'NOT_AUTHORIZED'; end if;

  select * into o from public.orders where id = p_order_id for update;
  if not found or o.status = 'ยกเลิก' then raise exception 'ORDER_NOT_FOUND'; end if;
  select status into v_status from public.bills where id = o.bill_id;
  if v_status <> 'open' then raise exception 'BILL_NOT_OPEN'; end if;
  if p_line is null or p_line < 0 or p_line >= jsonb_array_length(o.items) then raise exception 'ORDER_NOT_FOUND'; end if;
  if p_qty is not null and p_qty < 1 then raise exception 'INVALID_QTY'; end if;

  v_have := (o.items -> p_line ->> 'qty')::int;
  v_left := v_have - coalesce(p_qty, v_have);
  v_items := case when v_left > 0
                  then jsonb_set(o.items, array[p_line::text, 'qty'], to_jsonb(v_left))
                  else o.items - p_line end;

  if jsonb_array_length(v_items) = 0 then
    update public.orders set status = 'ยกเลิก' where id = o.id;
    return jsonb_build_object('items_left', 0, 'order_total', 0);
  end if;

  select coalesce(sum((e ->> 'price')::numeric * (e ->> 'qty')::int), 0) into v_total
    from jsonb_array_elements(v_items) e;
  update public.orders set items = v_items, total = v_total where id = o.id;   -- ยอดบิลคำนวณใหม่ด้วย trigger
  return jsonb_build_object('items_left', jsonb_array_length(v_items), 'order_total', v_total);
end;
$$;

revoke all on function public.remove_order_item(uuid, int, int) from public, anon;
grant execute on function public.remove_order_item(uuid, int, int) to authenticated;

