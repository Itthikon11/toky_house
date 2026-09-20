import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// ถ้ายังไม่ได้ตั้งค่า .env จะเป็น null และระบบจะสลับไปใช้ mock data อัตโนมัติ
export const isSupabaseConfigured =
  !!url && !!anonKey && !url.includes('YOUR-PROJECT')

export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey)
  : null
