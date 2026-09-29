// Backend จำลองสำหรับโหมดทดลอง — เก็บข้อมูลใน localStorage ของเบราว์เซอร์นี้เท่านั้น
// ทำงานเหมือนฟังก์ชันใน supabase/schema.sql ทุกอย่าง (รวมบิล, จำกัดความถี่, คิดราคาจากเมนู)
// ⚠️ ข้อมูลไม่แชร์ข้ามเครื่อง: ใช้จริงหลายเครื่องต้องเชื่อม Supabase

import {
  BILL_STATUS,
  CALL_REASONS,
  LIMITS,
  ORDER_STATUS,
  ORDER_STATUS_CANCELLED,
  PAYMENT_METHODS,
  RETENTION,
  STORAGE_KEYS,
} from '../../config/constants'
import { readJSON, writeJSON, remove } from '../../lib/storage'
import {
  cleanText,
  hashAdminPassword,
  randomId,
  randomToken,
  safeEqual,
} from '../../lib/security'
import { byCode, localDateKey } from '../../lib/format'
import { blobToDataUrl } from '../../lib/image'
import { AppError } from '../errors'
import { MENU_SEED, makeExpenseCategories, makeHistory, makeTables } from './seed'

const DB_VERSION = 2
const CHANGE_EVENT = 'th-mock-db-change'

// ---------- ที่เก็บข้อมูล ----------
function seedDb() {
  const tables = makeTables()
  const { bills, orders } = makeHistory(tables)
  return {
    version: DB_VERSION,
    menu: MENU_SEED,
    tables,
    bills,
    orders,
    calls: [],
    expenseCategories: makeExpenseCategories(),
    expenses: [],
    retention: { cycle_start: localDateKey(new Date()), last_purge_at: null, last_purged: null },
  }
}

function load() {
  const db = readJSON(STORAGE_KEYS.MOCK_DB)
  if (db && db.version === DB_VERSION) {
    // ข้อมูลโหมดทดลองที่สร้างก่อนมีหน้าการเงิน → เติมหมวดเริ่มต้นให้ (ไม่ล้างข้อมูลเดิม)
    if (!db.expenseCategories) {
      db.expenseCategories = makeExpenseCategories()
      db.expenses = []
    }
    if (!db.retention) db.retention = { cycle_start: localDateKey(new Date()), last_purge_at: null, last_purged: null }
    return db
  }
  const fresh = seedDb()
  writeJSON(STORAGE_KEYS.MOCK_DB, fresh)
  return fresh
}

function commit(db) {
  // localStorage จุได้ ~5 MB — ถ้าเต็ม (เช่น อัปโหลดรูปเยอะ) ให้แจ้ง ไม่ใช่เงียบหาย
  if (!writeJSON(STORAGE_KEYS.MOCK_DB, db)) throw new AppError('STORAGE_FULL')
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

function mutate(fn) {
  const db = load()
  const result = fn(db)
  commit(db)
  return result
}

// จำลองความหน่วงของเครือข่าย + คืนสำเนาเพื่อไม่ให้ผู้เรียกแก้ข้อมูลตรง ๆ
const respond = (value) =>
  new Promise((resolve) =>
    setTimeout(() => resolve(value === undefined ? value : JSON.parse(JSON.stringify(value))), 120),
  )
const reject = (code, detail) =>
  new Promise((_, rej) => setTimeout(() => rej(new AppError(code, detail)), 120))

const nowIso = () => new Date().toISOString()

function tableByToken(db, token) {
  return db.tables.find((t) => t.token === token && t.active)
}

function recalcBill(db, billId) {
  const bill = db.bills.find((b) => b.id === billId)
  if (!bill) return
  bill.total = db.orders
    .filter((o) => o.bill_id === billId && o.status !== ORDER_STATUS_CANCELLED)
    .reduce((s, o) => s + o.total, 0)
  bill.updated_at = nowIso()
}

function withOrders(db, bill) {
  return {
    ...bill,
    orders: db.orders
      .filter((o) => o.bill_id === bill.id)
      .sort((a, b) => a.round - b.round),
  }
}

// ---------- สิทธิ์พนักงาน (โหมดทดลอง) ----------
const DEFAULT_HASH = hashAdminPassword('admin1234')
const ADMIN_HASH = (import.meta.env.VITE_ADMIN_PASSWORD_HASH || DEFAULT_HASH).toLowerCase()
export const usingDefaultPassword = ADMIN_HASH === DEFAULT_HASH

function currentSession() {
  const s = readJSON(STORAGE_KEYS.ADMIN_SESSION)
  if (!s || typeof s.expiresAt !== 'number' || s.expiresAt < Date.now() || s.hash !== ADMIN_HASH.slice(0, 12)) {
    return null
  }
  return s
}

function requireStaff() {
  if (!currentSession()) throw new AppError('NOT_AUTHORIZED')
}

async function staffOnly(fn) {
  try {
    requireStaff()
    return respond(fn())
  } catch (e) {
    return reject(e.code || 'UNKNOWN')
  }
}

export const auth = {
  mode: 'local',
  async getSession() {
    const s = currentSession()
    return s ? { user: { email: 'admin (โหมดทดลอง)' } } : null
  },
  async signIn({ password }) {
    await new Promise((r) => setTimeout(r, 400)) // หน่วงเวลาให้เดารหัสช้าลง
    if (!safeEqual(hashAdminPassword(password || ''), ADMIN_HASH)) {
      throw new AppError('BAD_CREDENTIALS')
    }
    writeJSON(STORAGE_KEYS.ADMIN_SESSION, {
      id: randomToken(16),
      hash: ADMIN_HASH.slice(0, 12), // เปลี่ยนรหัสแล้ว session เก่าใช้ไม่ได้ทันที
      expiresAt: Date.now() + LIMITS.ADMIN_SESSION_HOURS * 3600 * 1000,
    })
    return { user: { email: 'admin (โหมดทดลอง)' } }
  },
  async signOut() {
    remove(STORAGE_KEYS.ADMIN_SESSION)
  },
  onChange(cb) {
    const handler = (e) => {
      if (e.key === STORAGE_KEYS.ADMIN_SESSION) cb()
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  },
}

// ---------- ลูกค้า ----------
export async function getMenu() {
  return respond(load().menu.slice().sort(byCode))
}

export async function resolveTable(token) {
  const t = tableByToken(load(), token)
  if (!t) return reject('INVALID_TABLE')
  return respond({ id: t.id, label: t.label, is_takeaway: t.is_takeaway })
}

export async function placeOrder({ token, items, note, billId, clientKey }) {
  const db = load()
  const table = tableByToken(db, token)
  if (!table) return reject('INVALID_TABLE')

  // กันส่งซ้ำ (เช่น กดปุ่มสองครั้ง / เน็ตหลุดแล้วส่งใหม่)
  if (clientKey) {
    const dup = db.orders.find((o) => o.client_key === clientKey)
    if (dup) {
      const bill = db.bills.find((b) => b.id === dup.bill_id)
      return respond(orderResult(table, bill, dup))
    }
  }

  if (!Array.isArray(items) || !items.length) return reject('EMPTY_ORDER')
  if (items.length > LIMITS.MAX_LINES_PER_ORDER) return reject('TOO_MANY_ITEMS')
  const cleanNote = cleanText(note, LIMITS.MAX_NOTE_LENGTH)

  const windowStart = Date.now() - LIMITS.ORDER_RATE_WINDOW_SEC * 1000
  const tableBillIds = new Set(db.bills.filter((b) => b.table_id === table.id).map((b) => b.id))
  const recent = db.orders.filter(
    (o) => tableBillIds.has(o.bill_id) && new Date(o.created_at).getTime() > windowStart,
  ).length
  if (recent >= LIMITS.ORDER_RATE_MAX) return reject('RATE_LIMIT')

  // ราคา/ชื่อ ดึงจากเมนูในระบบเสมอ — ไม่เชื่อราคาที่ส่งมาจากเครื่องลูกค้า
  const lines = []
  for (const line of items) {
    const qty = Number(line.qty)
    if (!Number.isInteger(qty) || qty < 1 || qty > LIMITS.MAX_QTY_PER_LINE) return reject('INVALID_QTY')
    const menu = db.menu.find((m) => m.id === line.menu_id)
    if (!menu || !menu.available) return reject('ITEM_UNAVAILABLE', menu?.name || line.menu_id)
    lines.push({ menu_id: menu.id, name: menu.name, price: Number(menu.price), qty })
  }
  const orderTotal = lines.reduce((s, l) => s + l.price * l.qty, 0)

  // หาบิลที่ยังไม่ชำระของโต๊ะนี้ → ถ้ามี "รวมบิล", ถ้าไม่มี เปิดบิลใหม่
  let bill = table.is_takeaway
    ? db.bills.find((b) => b.id === billId && b.table_id === table.id && b.status === BILL_STATUS.OPEN)
    : db.bills.find((b) => b.table_id === table.id && b.status === BILL_STATUS.OPEN)

  if (!bill) {
    bill = {
      id: randomId(),
      table_id: table.id,
      table_label: table.label,
      is_takeaway: table.is_takeaway,
      status: BILL_STATUS.OPEN,
      total: 0,
      payment_method: null,
      created_at: nowIso(),
      updated_at: nowIso(),
      paid_at: null,
    }
    db.bills.unshift(bill)
  }

  const round = db.orders.filter((o) => o.bill_id === bill.id).reduce((m, o) => Math.max(m, o.round), 0) + 1
  const order = {
    id: randomId(),
    bill_id: bill.id,
    round,
    items: lines,
    total: orderTotal,
    note: cleanNote,
    status: ORDER_STATUS[0],
    client_key: clientKey || null,
    created_at: nowIso(),
  }
  db.orders.unshift(order)
  recalcBill(db, bill.id)
  commit(db)
  return respond(orderResult(table, bill, order))
}

function orderResult(table, bill, order) {
  return {
    bill_id: bill.id,
    order_id: order.id,
    round: order.round,
    order_total: order.total,
    bill_total: bill.total,
    table_label: table.label,
    is_takeaway: table.is_takeaway,
  }
}

export async function getTableBill({ token, billId }) {
  const db = load()
  const table = tableByToken(db, token)
  if (!table) return reject('INVALID_TABLE')
  const bill = table.is_takeaway
    ? db.bills.find((b) => b.id === billId && b.table_id === table.id)
    : db.bills.find((b) => b.table_id === table.id && b.status === BILL_STATUS.OPEN)
  const safe = bill && withOrders(db, bill)
  if (safe) safe.orders = safe.orders.map(({ client_key, ...o }) => o)
  return respond({ table_label: table.label, bill: safe || null })
}

export async function callStaff({ token, reason }) {
  if (!CALL_REASONS[reason]) return reject('INVALID_REASON')
  const db = load()
  const table = tableByToken(db, token)
  if (!table) return reject('INVALID_TABLE')

  const existing = db.calls.find((c) => c.table_id === table.id && c.reason === reason && c.status === 'pending')
  if (existing) {
    const since = (Date.now() - new Date(existing.last_called_at).getTime()) / 1000
    if (since < LIMITS.CALL_COOLDOWN_SEC) {
      return respond({ status: 'cooldown', retry_after: Math.ceil(LIMITS.CALL_COOLDOWN_SEC - since) })
    }
    existing.repeat_count += 1
    existing.last_called_at = nowIso()
    commit(db)
    return respond({ status: 'repeated', retry_after: LIMITS.CALL_COOLDOWN_SEC })
  }

  db.calls.unshift({
    id: randomId(),
    table_id: table.id,
    table_label: table.label,
    reason,
    status: 'pending',
    repeat_count: 1,
    created_at: nowIso(),
    last_called_at: nowIso(),
    handled_at: null,
  })
  commit(db)
  return respond({ status: 'created', retry_after: LIMITS.CALL_COOLDOWN_SEC })
}

// ---------- พนักงาน ----------
// เพิ่ม/แก้เมนู (upsert ตาม id เหมือน Supabase) — ส่งมาทีละรายการหรือหลายรายการก็ได้
export const saveMenu = (items) =>
  staffOnly(() =>
    mutate((db) => {
      for (const item of items) {
        const i = db.menu.findIndex((m) => m.id === item.id)
        if (i >= 0) db.menu[i] = { ...db.menu[i], ...item }
        else db.menu.push(item)
      }
      return true
    }),
  )

// เปิด/ปิดการขาย (กดเดียวบันทึกทันที)
export const setMenuAvailability = (id, available) =>
  staffOnly(() =>
    mutate((db) => {
      const m = db.menu.find((x) => x.id === id)
      if (!m) throw new AppError('UNKNOWN')
      m.available = !!available
      return true
    }),
  )

// โหมดทดลอง: เก็บรูปเป็น data URL ในเบราว์เซอร์ (ย่อแล้ว ~100 KB ต่อรูป)
export async function uploadMenuImage(blob) {
  try {
    requireStaff()
  } catch (e) {
    return reject(e.code)
  }
  return blobToDataUrl(blob)
}

export const deleteMenuItems = (ids) =>
  staffOnly(() =>
    mutate((db) => {
      db.menu = db.menu.filter((m) => !ids.includes(m.id))
      return true
    }),
  )

export const listOpenBills = () =>
  staffOnly(() => {
    const db = load()
    return db.bills
      .filter((b) => b.status === BILL_STATUS.OPEN)
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
      .map((b) => withOrders(db, b))
  })

export const listClosedBills = ({ from, to }) =>
  staffOnly(() => {
    const db = load()
    return db.bills
      .filter((b) => b.status !== BILL_STATUS.OPEN)
      .filter((b) => {
        const at = b.paid_at || b.updated_at
        return (!from || at >= from) && (!to || at <= to)
      })
      .sort((a, b) => (b.paid_at || b.updated_at).localeCompare(a.paid_at || a.updated_at))
      .map((b) => withOrders(db, b))
  })

export const markBillPaid = (id, method) =>
  staffOnly(() =>
    mutate((db) => {
      if (!PAYMENT_METHODS[method]) throw new AppError('UNKNOWN')
      const bill = db.bills.find((b) => b.id === id)
      if (!bill || bill.status !== BILL_STATUS.OPEN) throw new AppError('BILL_NOT_OPEN')
      recalcBill(db, id)
      bill.status = BILL_STATUS.PAID
      bill.payment_method = method
      bill.paid_at = nowIso()
      // ชำระแล้ว = ปิดการเรียก "ขอชำระเงิน" ของโต๊ะนี้ให้อัตโนมัติ
      db.calls
        .filter((c) => c.table_id === bill.table_id && c.status === 'pending' && c.reason === 'bill')
        .forEach((c) => Object.assign(c, { status: 'done', handled_at: nowIso() }))
      return true
    }),
  )

export const cancelBill = (id) =>
  staffOnly(() =>
    mutate((db) => {
      const bill = db.bills.find((b) => b.id === id)
      if (!bill || bill.status !== BILL_STATUS.OPEN) throw new AppError('BILL_NOT_OPEN')
      bill.status = BILL_STATUS.CANCELLED
      bill.updated_at = nowIso()
      return true
    }),
  )

export const updateOrderStatus = (orderId, status) =>
  staffOnly(() =>
    mutate((db) => {
      if (!ORDER_STATUS.includes(status)) throw new AppError('UNKNOWN')
      const order = db.orders.find((o) => o.id === orderId)
      if (!order) throw new AppError('UNKNOWN')
      // บิลที่ปิดแล้ว: ยกเลิก/เลิกยกเลิกรอบไม่ได้ (ยอดที่รับเงินแล้วต้องไม่เปลี่ยน) — เหมือน trigger ใน schema.sql
      const bill = db.bills.find((b) => b.id === order.bill_id)
      const togglesCancel = (status === ORDER_STATUS_CANCELLED) !== (order.status === ORDER_STATUS_CANCELLED)
      if (togglesCancel && bill && bill.status !== BILL_STATUS.OPEN) throw new AppError('BILL_NOT_OPEN')
      order.status = status
      recalcBill(db, order.bill_id)
      return true
    }),
  )

// คิวออเดอร์ในแดชบอร์ด: ทุกรอบที่ยังไม่เสิร์ฟ (ไม่จำกัดเวลา) + ที่เสิร์ฟแล้วใน 12 ชม. พร้อมชื่อโต๊ะ
export const listKitchenOrders = () =>
  staffOnly(() => {
    const db = load()
    const since = new Date(Date.now() - 12 * 3600 * 1000).toISOString()
    const bills = new Map(db.bills.map((b) => [b.id, b]))
    return db.orders
      .filter((o) => o.status !== ORDER_STATUS_CANCELLED)
      .filter((o) => o.status !== ORDER_STATUS[2] || o.created_at >= since)
      .map(({ client_key, ...o }) => ({
        ...o,
        table_label: bills.get(o.bill_id)?.table_label || '-',
        is_takeaway: !!bills.get(o.bill_id)?.is_takeaway,
      }))
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
  })

export const listPendingCalls = () =>
  staffOnly(() =>
    load()
      .calls.filter((c) => c.status === 'pending')
      .sort((a, b) => b.last_called_at.localeCompare(a.last_called_at)),
  )

export const resolveCall = (id) =>
  staffOnly(() =>
    mutate((db) => {
      const c = db.calls.find((x) => x.id === id)
      if (c) Object.assign(c, { status: 'done', handled_at: nowIso() })
      return true
    }),
  )

export const listTables = () =>
  staffOnly(() => load().tables.slice().sort((a, b) => a.sort - b.sort))

export const createTable = (label) =>
  staffOnly(() =>
    mutate((db) => {
      const nums = db.tables.map((t) => Number(t.id)).filter(Number.isFinite)
      const n = (nums.length ? Math.max(...nums) : 0) + 1
      const table = {
        id: String(n),
        label: cleanText(label, 40) || `โต๊ะที่ ${String(n).padStart(2, '0')}`,
        is_takeaway: false,
        token: randomToken(12),
        active: true,
        sort: n,
      }
      db.tables.push(table)
      return table
    }),
  )

export const updateTable = (id, patch) =>
  staffOnly(() =>
    mutate((db) => {
      const t = db.tables.find((x) => x.id === id)
      if (!t) throw new AppError('UNKNOWN')
      if ('label' in patch) t.label = cleanText(patch.label, 40) || t.label
      if ('active' in patch) t.active = !!patch.active
      return t
    }),
  )

export const regenerateTableToken = (id) =>
  staffOnly(() =>
    mutate((db) => {
      const t = db.tables.find((x) => x.id === id)
      if (!t) throw new AppError('UNKNOWN')
      t.token = randomToken(12)
      return t
    }),
  )

// ---------- การเงิน & บัญชี (รายจ่าย + หมวด) ----------
const byCategoryOrder = (a, b) => a.sort - b.sort || a.name.localeCompare(b.name, 'th')

export const listExpenseCategories = () =>
  staffOnly(() => load().expenseCategories.slice().sort(byCategoryOrder))

export const saveExpenseCategory = ({ id, name }) =>
  staffOnly(() =>
    mutate((db) => {
      const clean = cleanText(name, 40)
      if (!clean) throw new AppError('UNKNOWN')
      if (db.expenseCategories.some((c) => c.id !== id && c.name.toLowerCase() === clean.toLowerCase())) {
        throw new AppError('DUPLICATE')
      }
      if (id) {
        const c = db.expenseCategories.find((x) => x.id === id)
        if (!c) throw new AppError('UNKNOWN')
        c.name = clean
        return c
      }
      const c = { id: randomId(), name: clean, sort: 50, created_at: nowIso() }
      db.expenseCategories.push(c)
      return c
    }),
  )

export const deleteExpenseCategory = (id) =>
  staffOnly(() =>
    mutate((db) => {
      if (db.expenses.some((e) => e.category_id === id)) throw new AppError('IN_USE')
      db.expenseCategories = db.expenseCategories.filter((c) => c.id !== id)
      return true
    }),
  )

export const listExpenses = ({ from, to }) =>
  staffOnly(() =>
    load()
      .expenses.filter((e) => (!from || e.spent_on >= from) && (!to || e.spent_on <= to))
      .sort((a, b) => b.spent_on.localeCompare(a.spent_on) || b.created_at.localeCompare(a.created_at)),
  )

export const saveExpense = ({ id, category_id, amount, spent_on, note }) =>
  staffOnly(() =>
    mutate((db) => {
      const n = Number(amount)
      if (!Number.isFinite(n) || n <= 0 || n > 10000000) throw new AppError('UNKNOWN')
      if (!db.expenseCategories.some((c) => c.id === category_id)) throw new AppError('UNKNOWN')
      const row = { category_id, amount: n, spent_on, note: cleanText(note, 200) || null }
      if (id) {
        const e = db.expenses.find((x) => x.id === id)
        if (!e) throw new AppError('UNKNOWN')
        Object.assign(e, row)
        return { id }
      }
      const e = { id: randomId(), ...row, created_at: nowIso() }
      db.expenses.push(e)
      return { id: e.id }
    }),
  )

export const deleteExpense = (id) =>
  staffOnly(() =>
    mutate((db) => {
      db.expenses = db.expenses.filter((e) => e.id !== id)
      return true
    }),
  )

// ---------- ล้างข้อมูลทุกรอบ 65 วัน (เหมือน run_retention ใน schema.sql) ----------
const dayDiff = (a, b) => Math.round((new Date(`${a}T00:00:00`) - new Date(`${b}T00:00:00`)) / 86400000)
const addDays = (key, n) => {
  const d = new Date(`${key}T00:00:00`)
  d.setDate(d.getDate() + n)
  return localDateKey(d)
}

export const getRetention = () =>
  staffOnly(() =>
    mutate((db) => {
      const today = localDateKey(new Date())
      const r = db.retention
      const cycles = Math.floor(dayDiff(today, r.cycle_start) / RETENTION.CYCLE_DAYS)
      if (cycles >= 1) {
        const closed = new Set(db.bills.filter((b) => b.status !== BILL_STATUS.OPEN).map((b) => b.id))
        const purged = { bills: closed.size, expenses: db.expenses.length, calls: db.calls.filter((c) => c.status === 'done').length }
        db.bills = db.bills.filter((b) => !closed.has(b.id))
        db.orders = db.orders.filter((o) => !closed.has(o.bill_id))
        db.expenses = []
        db.calls = db.calls.filter((c) => c.status !== 'done')
        Object.assign(r, { cycle_start: addDays(r.cycle_start, cycles * RETENTION.CYCLE_DAYS), last_purge_at: nowIso(), last_purged: purged })
      }
      const purgeOn = addDays(r.cycle_start, RETENTION.CYCLE_DAYS)
      return { ...r, purge_on: purgeOn, days_left: dayDiff(purgeOn, today) }
    }),
  )

// แจ้งเตือนเมื่อข้อมูลเปลี่ยน (แท็บเดียวกัน + แท็บอื่นในเบราว์เซอร์เดียวกัน)
export function subscribe(cb) {
  const onStorage = (e) => {
    if (e.key === STORAGE_KEYS.MOCK_DB) cb()
  }
  window.addEventListener(CHANGE_EVENT, cb)
  window.addEventListener('storage', onStorage)
  return () => {
    window.removeEventListener(CHANGE_EVENT, cb)
    window.removeEventListener('storage', onStorage)
  }
}
