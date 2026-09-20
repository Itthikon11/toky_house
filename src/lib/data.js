import { supabase, isSupabaseConfigured } from './supabase'
import {
  MENU_SEED,
  makeSeedOrders,
  MONTHLY_SALES,
  FORECAST,
} from './mockData'

/*
 * ชั้นเข้าถึงข้อมูล (Data Access Layer)
 * - ถ้าตั้งค่า Supabase แล้ว -> ใช้ Supabase จริง
 * - ถ้ายัง -> ใช้ mock data เก็บใน localStorage (แก้ไข/สั่งออเดอร์แล้วอยู่คงที่จนกว่าจะล้าง)
 */

const LS_MENU = 'th_menu'
const LS_ORDERS = 'th_orders'

function lsGet(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}
function lsSet(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val))
  } catch {
    /* ignore */
  }
}

function ensureSeed() {
  if (!lsGet(LS_MENU, null)) lsSet(LS_MENU, MENU_SEED)
  if (!lsGet(LS_ORDERS, null)) lsSet(LS_ORDERS, makeSeedOrders())
}

// ---------- MENU ----------
export async function getMenu() {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .order('code', { ascending: true })
    if (error) throw error
    return data
  }
  ensureSeed()
  return lsGet(LS_MENU, MENU_SEED)
}

export async function saveMenu(items) {
  if (isSupabaseConfigured) {
    const { error } = await supabase
      .from('menu_items')
      .upsert(items, { onConflict: 'id' })
    if (error) throw error
    return true
  }
  lsSet(LS_MENU, items)
  return true
}

export async function deleteMenuItems(ids) {
  if (isSupabaseConfigured) {
    const { error } = await supabase.from('menu_items').delete().in('id', ids)
    if (error) throw error
    return true
  }
  const items = lsGet(LS_MENU, MENU_SEED).filter((m) => !ids.includes(m.id))
  lsSet(LS_MENU, items)
  return true
}

// ---------- ORDERS ----------
export async function getOrders() {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  }
  ensureSeed()
  return lsGet(LS_ORDERS, [])
}

export async function createOrder(order) {
  const payload = {
    table_label: order.table_label,
    is_takeaway: !!order.is_takeaway,
    items: order.items,
    total: order.total,
    status: 'รับออเดอร์',
    created_at: new Date().toISOString(),
  }
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('orders')
      .insert(payload)
      .select()
      .single()
    if (error) throw error
    return data
  }
  const orders = lsGet(LS_ORDERS, [])
  const withId = { id: `ORD-${Date.now()}`, ...payload }
  orders.unshift(withId)
  lsSet(LS_ORDERS, orders)
  return withId
}

export async function updateOrderStatus(id, status) {
  if (isSupabaseConfigured) {
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', id)
    if (error) throw error
    return true
  }
  const orders = lsGet(LS_ORDERS, []).map((o) =>
    o.id === id ? { ...o, status } : o,
  )
  lsSet(LS_ORDERS, orders)
  return true
}

// ---------- STATS ----------
export async function getMonthlySales() {
  // (ตัวอย่าง) — ต่อจริงทำเป็น view/RPC บน Supabase ได้
  return MONTHLY_SALES
}

export async function getForecast() {
  return FORECAST
}

export { isSupabaseConfigured }
