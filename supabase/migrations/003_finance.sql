-- ==========================================================================
-- TOKYO HOUSE — อัปเกรดเป็น v3: หน้า "การเงิน & บัญชี" (หมวดรายจ่าย)
-- สำหรับโปรเจกต์ที่เคยรัน schema.sql (v2) ไปแล้ว: วางไฟล์นี้ใน SQL Editor แล้ว Run
-- (รันซ้ำได้ ไม่ทำข้อมูลหาย · ติดตั้งใหม่ไม่ต้องใช้ไฟล์นี้ — schema.sql มีครบแล้ว)
-- ==========================================================================

create table if not exists public.expense_categories (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique check (char_length(name) between 1 and 40),
  sort       int not null default 0,
  created_at timestamptz not null default now()
);

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

alter table public.expense_categories enable row level security;
drop policy if exists "staff only" on public.expense_categories;
create policy "staff only" on public.expense_categories
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

insert into public.expense_categories (name, sort) values
  ('วัตถุดิบ', 1), ('บรรจุภัณฑ์', 2), ('ค่าแก๊ส', 3), ('ค่าไฟ', 4),
  ('ค่าน้ำ', 5), ('ค่าเช่า', 6), ('ค่าแรง', 7), ('อื่น ๆ', 99)
on conflict (name) do nothing;
