// Backend จริงบน Supabase
// - ลูกค้า (anon) เรียกได้เฉพาะฟังก์ชัน RPC: get_table_info / place_order / get_table_bill / call_staff
// - พนักงาน (ล็อกอิน + อยู่ในตาราง staff_members) อ่าน/แก้ตารางได้ตาม RLS
// ดูรายละเอียดสิทธิ์ทั้งหมดที่ supabase/schema.sql

import { supabase } from '../../lib/supabase'
import { randomId, randomToken, cleanText } from '../../lib/security'
import { byCode } from '../../lib/format'
import { BILL_STATUS, PAYMENT_METHODS } from '../../config/constants'
import { AppError } from '../errors'
import { FORECAST, MONTHLY_COSTS } from '../mock/seed'

function unwrap({ data, error }) {
  if (error) throw error
  return data
}

const BILL_WITH_ORDERS = '*, orders(id, bill_id, round, items, total, note, status, created_at)'

function sortOrders(bill) {
  return { ...bill, orders: (bill.orders || []).slice().sort((a, b) => a.round - b.round) }
}

// ---------- สิทธิ์พนักงาน ----------
async function assertStaff() {
  const ok = unwrap(await supabase.rpc('is_staff'))
  if (!ok) throw new AppError('NOT_STAFF')
}

export const auth = {
  mode: 'supabase',
  async getSession() {
    const { data } = await supabase.auth.getSession()
    if (!data.session) return null
    try {
      await assertStaff()
    } catch {
      await supabase.auth.signOut()
      return null
    }
    return { user: data.session.user }
  },
  async signIn({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanText(email, 120),
      password,
    })
    if (error) throw new AppError('BAD_CREDENTIALS')
    try {
      await assertStaff()
    } catch (e) {
      await supabase.auth.signOut()
      throw e
    }
    return { user: data.user }
  },
  async signOut() {
    await supabase.auth.signOut()
  },
  onChange(cb) {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') cb()
    })
    return () => data.subscription.unsubscribe()
  },
}

// ---------- ลูกค้า ----------
export async function getMenu() {
  const rows = unwrap(await supabase.from('menu_items').select('*'))
  return rows.sort(byCode)
}

export async function resolveTable(token) {
  return unwrap(await supabase.rpc('get_table_info', { p_token: token }))
}

export async function placeOrder({ token, items, note, billId, clientKey }) {
  return unwrap(
    await supabase.rpc('place_order', {
      p_token: token,
      p_items: items.map((i) => ({ menu_id: i.menu_id, qty: i.qty })),
      p_note: note || null,
      p_bill_id: billId || null,
      p_client_key: clientKey || null,
    }),
  )
}

export async function getTableBill({ token, billId }) {
  return unwrap(
    await supabase.rpc('get_table_bill', { p_token: token, p_bill_id: billId || null }),
  )
}

export async function callStaff({ token, reason }) {
  return unwrap(await supabase.rpc('call_staff', { p_token: token, p_reason: reason }))
}

// ---------- พนักงาน ----------
export async function saveMenu(items) {
  unwrap(await supabase.from('menu_items').upsert(items, { onConflict: 'id' }))
  return true
}

// เปิด/ปิดการขาย (กดเดียวบันทึกทันที)
export async function setMenuAvailability(id, available) {
  unwrap(await supabase.from('menu_items').update({ available: !!available }).eq('id', id))
  return true
}

// อัปโหลดรูปเมนูไปที่ Supabase Storage (bucket "menu-images" — สร้างไว้ใน schema.sql)
export async function uploadMenuImage(blob) {
  const ext = blob.type === 'image/webp' ? 'webp' : 'jpg'
  const path = `${randomId()}.${ext}`
  const bucket = supabase.storage.from('menu-images')
  unwrap(await bucket.upload(path, blob, { contentType: blob.type, cacheControl: '31536000', upsert: false }))
  return bucket.getPublicUrl(path).data.publicUrl
}

export async function deleteMenuItems(ids) {
  unwrap(await supabase.from('menu_items').delete().in('id', ids))
  return true
}

export async function listOpenBills() {
  const rows = unwrap(
    await supabase
      .from('bills')
      .select(BILL_WITH_ORDERS)
      .eq('status', BILL_STATUS.OPEN)
      .order('updated_at', { ascending: false }),
  )
  return rows.map(sortOrders)
}

export async function listClosedBills({ from, to }) {
  let q = supabase
    .from('bills')
    .select(BILL_WITH_ORDERS)
    .neq('status', BILL_STATUS.OPEN)
    .order('updated_at', { ascending: false })
    .limit(1000)
  if (from) q = q.gte('updated_at', from)
  if (to) q = q.lte('updated_at', to)
  return unwrap(await q).map(sortOrders)
}

export async function markBillPaid(id, method) {
  if (!PAYMENT_METHODS[method]) throw new AppError('UNKNOWN')
  return unwrap(await supabase.rpc('close_bill', { p_bill_id: id, p_method: method }))
}

export async function cancelBill(id) {
  const rows = unwrap(
    await supabase
      .from('bills')
      .update({ status: BILL_STATUS.CANCELLED })
      .eq('id', id)
      .eq('status', BILL_STATUS.OPEN)
      .select('id'),
  )
  if (!rows.length) throw new AppError('BILL_NOT_OPEN')
  return true
}

export async function updateOrderStatus(orderId, status) {
  unwrap(await supabase.from('orders').update({ status }).eq('id', orderId))
  return true
}

// คิวออเดอร์ในแดชบอร์ด: ทุกรอบที่ยังไม่เสิร์ฟ (ไม่จำกัดเวลา) + ที่เสิร์ฟแล้วใน 12 ชม. พร้อมชื่อโต๊ะ
export async function listKitchenOrders() {
  const since = new Date(Date.now() - 12 * 3600 * 1000).toISOString()
  const rows = unwrap(
    await supabase
      .from('orders')
      .select('id, bill_id, round, items, total, note, status, created_at, bills(table_label, is_takeaway)')
      .or(`status.in.("รับออเดอร์","กำลังทำ"),and(status.eq."เสิร์ฟแล้ว",created_at.gte."${since}")`)
      .order('created_at', { ascending: true })
      .limit(500),
  )
  return rows.map(({ bills, ...o }) => ({
    ...o,
    table_label: bills?.table_label || '-',
    is_takeaway: !!bills?.is_takeaway,
  }))
}

export async function listPendingCalls() {
  return unwrap(
    await supabase
      .from('staff_calls')
      .select('*')
      .eq('status', 'pending')
      .order('last_called_at', { ascending: false }),
  )
}

export async function resolveCall(id) {
  unwrap(
    await supabase
      .from('staff_calls')
      .update({ status: 'done', handled_at: new Date().toISOString() })
      .eq('id', id),
  )
  return true
}

export async function listTables() {
  return unwrap(await supabase.from('dining_tables').select('*').order('sort'))
}

export async function createTable(label) {
  const existing = unwrap(await supabase.from('dining_tables').select('id, sort'))
  const nums = existing.map((t) => Number(t.id)).filter(Number.isFinite)
  const n = (nums.length ? Math.max(...nums) : 0) + 1
  return unwrap(
    await supabase
      .from('dining_tables')
      .insert({
        id: String(n),
        label: cleanText(label, 40) || `โต๊ะที่ ${String(n).padStart(2, '0')}`,
        sort: n,
      })
      .select()
      .single(),
  )
}

export async function updateTable(id, patch) {
  const allowed = {}
  if ('label' in patch) allowed.label = cleanText(patch.label, 40)
  if ('active' in patch) allowed.active = !!patch.active
  return unwrap(
    await supabase.from('dining_tables').update(allowed).eq('id', id).select().single(),
  )
}

export async function regenerateTableToken(id) {
  return unwrap(
    await supabase
      .from('dining_tables')
      .update({ token: randomToken(12) })
      .eq('id', id)
      .select()
      .single(),
  )
}

// ยังใช้ข้อมูลตัวอย่าง — ต่อยอดได้จากตาราง expenses
export async function getCosts() {
  return MONTHLY_COSTS
}
export async function getForecast() {
  return FORECAST
}

// Realtime: พนักงานเห็นออเดอร์ใหม่/การเรียกพนักงานทันที (RLS กรองให้เฉพาะพนักงาน)
export function subscribe(cb) {
  const channel = supabase
    .channel('staff-live')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'bills' }, cb)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, cb)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'staff_calls' }, cb)
    .subscribe()
  return () => supabase.removeChannel(channel)
}
