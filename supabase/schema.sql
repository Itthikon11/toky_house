-- ==========================================================
-- TOKYO HOUSE — Supabase schema
-- รันไฟล์นี้ใน Supabase Dashboard > SQL Editor
-- ==========================================================

-- เมนู
create table if not exists public.menu_items (
  id         text primary key,
  code       text not null,
  name       text not null,
  filling    text,                       -- ใส้: หวาน/คาว
  category   text,                       -- ประเภท เช่น ขนมโตเกียว
  price      numeric not null default 0,
  available  boolean not null default true,
  image      text,
  created_at timestamptz default now()
);

-- ออเดอร์
create table if not exists public.orders (
  id          uuid primary key default gen_random_uuid(),
  table_label text not null,             -- เช่น "โต๊ะที่ 01" หรือ "สั่งกลับบ้าน"
  is_takeaway boolean default false,
  items       jsonb not null default '[]'::jsonb,  -- [{menu_id,name,price,qty}]
  total       numeric not null default 0,
  status      text not null default 'รับออเดอร์',  -- รับออเดอร์ | ยังไม่ชำระ | ชำระแล้ว
  created_at  timestamptz default now()
);

create index if not exists orders_created_idx on public.orders (created_at desc);

-- (ทางเลือก) ตารางบันทึกค่าใช้จ่าย เพื่อทำกราฟต้นทุน
create table if not exists public.expenses (
  id         uuid primary key default gen_random_uuid(),
  category   text not null,              -- เครื่องทำความร้อน | น้ำ | ไฟฟ้า
  amount     numeric not null default 0,
  spent_on   date not null default current_date,
  created_at timestamptz default now()
);

-- ==========================================================
-- Row Level Security
-- โหมดเดโม: อนุญาตให้ anon อ่าน/เขียนได้ (ปรับให้เข้มขึ้นเมื่อขึ้นจริง)
-- ==========================================================
alter table public.menu_items enable row level security;
alter table public.orders     enable row level security;
alter table public.expenses   enable row level security;

create policy "menu read"   on public.menu_items for select using (true);
create policy "menu write"  on public.menu_items for all    using (true) with check (true);

create policy "orders read"  on public.orders for select using (true);
create policy "orders write" on public.orders for all    using (true) with check (true);

create policy "expenses read"  on public.expenses for select using (true);
create policy "expenses write" on public.expenses for all    using (true) with check (true);

-- ==========================================================
-- ข้อมูลเมนูตัวอย่าง
-- ==========================================================
insert into public.menu_items (id, code, name, filling, category, price, available, image) values
  ('A1','A1','สังขยาใบเตย + บัตเตอร์คุกกี้','หวาน','ขนมโตเกียว',100,true,'/images/products/S__11141155_0.jpg'),
  ('A2','A2','ช็อกโกแลต + วิปครีม','หวาน','ขนมโตเกียว',100,true,'/images/products/S__11141156_0.jpg'),
  ('A3','A3','ไส้กรอก + ชีสยืด','คาว','ขนมโตเกียว',120,true,'/images/products/S__11141157_0.jpg'),
  ('A4','A4','แฮม + ไข่ + พริกไทย','คาว','ขนมโตเกียว',120,false,'/images/products/S__11141136_0.jpg'),
  ('A5','A5','หมูหยอง + น้ำสลัด','คาว','ขนมโตเกียว',110,true,'/images/products/S__11141158_0.jpg'),
  ('A6','A6','ครีมสด + สตรอว์เบอร์รี','หวาน','ขนมโตเกียว',110,true,'/images/products/S__11141160_0.jpg'),
  ('A7','A7','ไข่เค็ม + ลาวา','หวาน','ขนมโตเกียว',130,false,'/images/products/S__11141161_0.jpg'),
  ('A8','A8','นูเทลล่า + กล้วย','หวาน','ขนมโตเกียว',120,true,'/images/products/S__11141162_0.jpg')
on conflict (id) do nothing;
