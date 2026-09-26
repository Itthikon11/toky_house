// จุดเดียวที่หน้าเว็บใช้เรียกข้อมูล
// - ตั้งค่า Supabase ใน .env แล้ว → ใช้ฐานข้อมูลจริง
// - ยังไม่ตั้งค่า → ใช้ backend จำลองในเบราว์เซอร์ (โหมดทดลอง)

import { isSupabaseConfigured } from '../lib/supabase'
import * as mockBackend from './mock/mockBackend'
import * as supabaseBackend from './supabase/supabaseBackend'

export const api = isSupabaseConfigured ? supabaseBackend : mockBackend
export const isDemoMode = !isSupabaseConfigured
export const usingDefaultPassword = isDemoMode && mockBackend.usingDefaultPassword

// ---------- Realtime แบบช่องทางเดียว (ประหยัดโควต้า Supabase Free Tier) ----------
// ทุก component ที่ต้องการข้อมูลสดใช้ channel เดียวกัน: เปิดเมื่อมีผู้ฟังคนแรก ปิดเมื่อไม่มีใครฟัง
const listeners = new Set()
let closeChannel = null
let debounceTimer = null

function emit() {
  clearTimeout(debounceTimer)
  // 1 ออเดอร์ทำให้เกิดหลาย event (orders + bills) → รวมเป็นครั้งเดียว
  debounceTimer = setTimeout(() => listeners.forEach((fn) => fn()), 250)
}

export function subscribeLive(fn) {
  listeners.add(fn)
  if (!closeChannel) closeChannel = api.subscribe(emit)
  return () => {
    listeners.delete(fn)
    if (!listeners.size && closeChannel) {
      closeChannel()
      closeChannel = null
    }
  }
}
