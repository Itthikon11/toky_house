-- ==========================================================================
-- TOKYO HOUSE — กันยอดบิลที่ชำระแล้วเปลี่ยน
-- วางไฟล์นี้ใน SQL Editor แล้ว Run (รันซ้ำได้ · schema.sql มีส่วนนี้แล้วสำหรับติดตั้งใหม่)
--
-- ปัญหาเดิม: ยกเลิก (หรือเลิกยกเลิก) รอบในบิลที่ชำระแล้ว → trigger คำนวณยอดใหม่
--            → ยอดในระบบไม่ตรงกับเงินที่รับจริง
-- หลังแก้: บิลที่ปิดแล้วยังเปลี่ยนสถานะ รอทำ/กำลังทำ/เสิร์ฟแล้ว ได้ (ครัวยังทำต่อได้)
--          แต่ยกเลิกรอบ / แก้รายการ / แก้ยอด ไม่ได้
-- ==========================================================================

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
