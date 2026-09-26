import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// ถ้ายังไม่ได้ตั้งค่า .env จะเป็น null และระบบจะสลับไปใช้โหมดทดลองอัตโนมัติ
// (anon key เปิดเผยได้ตามปกติ — ความปลอดภัยจริงอยู่ที่ RLS ใน supabase/schema.sql)
export const isSupabaseConfigured =
  !!url && !!anonKey && !url.includes('YOUR-PROJECT')

export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: { persistSession: true, autoRefreshToken: true },
      // จำกัด event ต่อวินาที ให้อยู่ในโควต้า Realtime ของ Free Tier
      realtime: { params: { eventsPerSecond: 5 } },
    })
  : null
