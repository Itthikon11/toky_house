// จอครัว TOKYO HOUSE — JavaScript ล้วน ไม่ใช้ React
// • ออเดอร์ใหม่เด้งขึ้นทันทีผ่าน Supabase Realtime (ใช้ channel เดียวร่วมกับทั้งแอป)
// • ไม่มีเซิร์ฟเวอร์ของเราเอง: เป็นไฟล์ static วางบน Vercel / Netlify / GitHub Pages ได้ฟรี
// • ทุกข้อความจากลูกค้าใส่ผ่าน textContent เท่านั้น (กัน XSS)

import './kitchen.css'
import { api, isDemoMode, subscribeLive } from '../services/api'
import { guardedSignIn, lockRemainingSec } from '../services/loginGuard'
import { toThaiMessage } from '../services/errors'
import { CALL_REASONS } from '../config/constants'
import { playChime, unlockAudio } from '../lib/sound'
import { readJSON, writeJSON } from '../lib/storage'
import { iconElement } from '../lib/icons'

const root = document.getElementById('kitchen')
const FALLBACK_POLL_MS = isDemoMode ? 5000 : 30000 // Realtime คือช่องทางหลัก polling แค่สำรอง
const LATE_MINUTES = 15
const DONE_VISIBLE_MINUTES = 30
const SOUND_KEY = 'th_kitchen_sound'

const state = {
  orders: [],
  calls: [],
  seenOrders: null,
  seenCalls: null,
  fresh: new Set(),
  busy: new Set(),
  online: true,
  lastSync: null,
  sound: readJSON(SOUND_KEY, true),
  stop: null,
}

// ---------- DOM helper (สร้าง element แบบปลอดภัย) ----------
function h(tag, props = {}, ...children) {
  const el = document.createElement(tag)
  for (const [k, v] of Object.entries(props)) {
    if (v == null || v === false) continue
    if (k === 'class') el.className = v
    else if (k.startsWith('on')) el.addEventListener(k.slice(2).toLowerCase(), v)
    else el.setAttribute(k, v === true ? '' : v)
  }
  for (const c of children.flat()) {
    if (c == null || c === false) continue
    el.append(c instanceof Node ? c : document.createTextNode(String(c)))
  }
  return el
}

const icon = (name, size = 20) => iconElement(name, { size })
const minutesSince = (iso) => Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
// 5 → "5 นาที", 130 → "2 ชม. 10 น."
const waitLabel = (mins) => (mins < 1 ? 'ใหม่' : mins < 60 ? `${mins} นาที` : `${Math.floor(mins / 60)} ชม. ${mins % 60} น.`)
const clock = (d = new Date()) => d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

// ---------- หน้าล็อกอิน ----------
function renderLogin(message = '') {
  const email = h('input', { type: 'email', placeholder: 'อีเมลพนักงาน', autocomplete: 'username', required: true })
  const password = h('input', { type: 'password', placeholder: 'รหัสผ่าน', autocomplete: 'current-password', required: true })
  const error = h('div', { class: 'k-error' }, message)
  const submit = h('button', { class: 'k-btn primary', type: 'submit', style: 'width:100%;margin-top:16px;padding:14px' }, 'เข้าสู่ระบบ')

  const form = h(
    'form',
    {
      onSubmit: async (e) => {
        e.preventDefault()
        submit.disabled = true
        error.textContent = ''
        try {
          await guardedSignIn({ email: email.value, password: password.value })
          start()
        } catch (err) {
          const locked = lockRemainingSec()
          error.textContent = locked ? `ใส่รหัสผิดหลายครั้ง กรุณารอ ${Math.ceil(locked / 60)} นาที` : toThaiMessage(err)
          password.value = ''
          submit.disabled = false
        }
      },
    },
    h('img', { src: '/images/LOGO.jpg', alt: '' }),
    h('h1', {}, 'จอครัว'),
    h('p', {}, 'TOKYO HOUSE · สำหรับพนักงาน'),
    api.auth.mode === 'supabase' ? email : null,
    password,
    error,
    submit,
  )
  root.replaceChildren(h('div', { class: 'k-login' }, form))
  ;(api.auth.mode === 'supabase' ? email : password).focus()
}

// ---------- ข้อมูล ----------
async function refresh() {
  try {
    const [orders, calls] = await Promise.all([api.listKitchenOrders(), api.listPendingCalls()])
    detectNew(orders, calls)
    state.orders = orders
    state.calls = calls
    state.online = true
    state.lastSync = new Date()
  } catch (e) {
    if (/NOT_AUTHORIZED|NOT_STAFF|JWT/.test(String(e?.message || e?.code))) {
      stop()
      renderLogin('หมดเวลาเข้าสู่ระบบ กรุณาเข้าสู่ระบบอีกครั้ง')
      return
    }
    state.online = false
  }
  render()
}

function detectNew(orders, calls) {
  let newOrder = false
  let newCall = false
  if (state.seenOrders) {
    for (const o of orders) {
      if (!state.seenOrders.has(o.id)) {
        newOrder = true
        state.fresh.add(o.id)
        setTimeout(() => state.fresh.delete(o.id), 4000)
      }
    }
  }
  if (state.seenCalls) {
    newCall = calls.some((c) => state.seenCalls.get(c.id) !== c.last_called_at)
  }
  state.seenOrders = new Set(orders.map((o) => o.id))
  state.seenCalls = new Map(calls.map((c) => [c.id, c.last_called_at]))
  if (state.sound && newCall) playChime('call')
  else if (state.sound && newOrder) playChime('order')
}

async function act(id, fn) {
  if (state.busy.has(id)) return
  state.busy.add(id)
  render()
  try {
    await fn()
  } catch (e) {
    alert(toThaiMessage(e))
  } finally {
    state.busy.delete(id)
    refresh()
  }
}

// ---------- แสดงผล ----------
function orderCard(o) {
  const mins = minutesSince(o.created_at)
  const stage = o.status === 'รับออเดอร์' ? 'new' : o.status === 'กำลังทำ' ? 'cooking' : 'done'
  const late = stage !== 'done' && mins >= LATE_MINUTES
  const busy = state.busy.has(o.id)

  const actions =
    stage === 'new'
      ? [
          h('button', { class: 'k-btn primary', disabled: busy, onClick: () => act(o.id, () => api.updateOrderStatus(o.id, 'กำลังทำ')) }, icon('cooking'), 'เริ่มทำ'),
          h('button', { class: 'k-btn go', disabled: busy, onClick: () => act(o.id, () => api.updateOrderStatus(o.id, 'เสิร์ฟแล้ว')) }, icon('check'), 'เสิร์ฟ'),
        ]
      : stage === 'cooking'
        ? [h('button', { class: 'k-btn go', disabled: busy, onClick: () => act(o.id, () => api.updateOrderStatus(o.id, 'เสิร์ฟแล้ว')) }, icon('check'), 'เสิร์ฟแล้ว')]
        : [h('button', { class: 'k-btn ghost', disabled: busy, onClick: () => act(o.id, () => api.updateOrderStatus(o.id, 'กำลังทำ')) }, icon('undo', 16), 'ย้อนกลับ')]

  return h(
    'article',
    { class: `k-card ${stage} ${late ? 'late' : ''} ${state.fresh.has(o.id) ? 'fresh' : ''}` },
    h(
      'div',
      { class: 'k-card-head' },
      h(
        'div',
        {},
        h('div', { class: 'k-table' }, o.table_label),
        h('span', { class: `k-round ${o.round > 1 ? 'more' : ''}` }, o.round > 1 ? `สั่งเพิ่ม · รอบ ${o.round}` : 'รอบแรก'),
      ),
      h(
        'div',
        { class: 'k-time' },
        h('b', {}, waitLabel(mins)),
        new Date(o.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
      ),
    ),
    h('ul', { class: 'k-items' }, o.items.map((it) => h('li', {}, h('span', { class: 'k-qty' }, `${it.qty}×`), h('span', {}, it.name)))),
    o.note ? h('div', { class: 'k-note' }, icon('note', 18), o.note) : null,
    h('div', { class: 'k-actions' }, actions),
  )
}

function column(kind, iconName, title, orders) {
  return h(
    'section',
    { class: `k-col ${kind}` },
    h('h2', {}, h('span', { class: 'k-col-title' }, icon(iconName, 22), title), h('span', { class: 'k-count' }, orders.length)),
    orders.length ? orders.map(orderCard) : h('div', { class: 'k-empty' }, icon('check', 28), h('div', {}, 'ไม่มีรายการ')),
  )
}

function render() {
  if (!state.stop) return
  const byStatus = (s) => state.orders.filter((o) => o.status === s)
  const done = byStatus('เสิร์ฟแล้ว')
    .filter((o) => minutesSince(o.created_at) < 12 * 60)
    .slice(-8)
    .reverse()
    .filter((o, i) => i < 3 || minutesSince(o.created_at) < DONE_VISIBLE_MINUTES)

  const header = h(
    'header',
    { class: 'k-header' },
    h('div', { class: 'k-brand' }, 'TOKYO ', h('span', {}, 'HOUSE'), ' · ครัว'),
    h('div', { class: 'k-clock' }, clock()),
    h(
      'div',
      { class: 'k-status' },
      h('span', { class: `k-dot ${state.online ? '' : 'off'}` }),
      state.online ? `ออนไลน์ · อัปเดต ${state.lastSync ? clock(state.lastSync) : '-'}` : 'ขาดการเชื่อมต่อ — กำลังลองใหม่',
    ),
    h('div', { class: 'k-spacer' }),
    h(
      'button',
      {
        class: 'k-btn',
        onClick: () => {
          state.sound = !state.sound
          writeJSON(SOUND_KEY, state.sound)
          if (state.sound) playChime('order')
          render()
        },
      },
      icon(state.sound ? 'soundOn' : 'soundOff'),
      state.sound ? 'เสียงเปิด' : 'เสียงปิด',
    ),
    h('button', { class: 'k-btn', onClick: () => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.()) }, icon('fullscreen'), 'เต็มจอ'),
    h('button', { class: 'k-btn', 'aria-label': 'รีเฟรช', onClick: () => refresh() }, icon('refresh')),
    h(
      'button',
      {
        class: 'k-btn ghost',
        onClick: async () => {
          stop()
          await api.auth.signOut()
          renderLogin()
        },
      },
      icon('logout', 16),
      'ออกจากระบบ',
    ),
  )

  const calls = state.calls.length
    ? h(
        'div',
        { class: 'k-calls' },
        state.calls.map((c) =>
          h(
            'div',
            { class: `k-call ${c.reason === 'bill' ? 'bill' : ''}` },
            h('span', { class: 'k-call-icon' }, icon(CALL_REASONS[c.reason]?.icon || 'hand', 24)),
            h(
              'div',
              {},
              h('b', {}, c.table_label),
              h('small', {}, `${CALL_REASONS[c.reason]?.label || 'เรียกพนักงาน'}${c.repeat_count > 1 ? ` · เรียก ${c.repeat_count} ครั้ง` : ''} · ${waitLabel(minutesSince(c.last_called_at))}`),
            ),
            h('button', { class: 'k-btn primary', disabled: state.busy.has(c.id), onClick: () => act(c.id, () => api.resolveCall(c.id)) }, 'รับทราบ'),
          ),
        ),
      )
    : null

  root.replaceChildren(
    header,
    isDemoMode ? h('div', { class: 'k-demo' }, icon('info', 16), 'โหมดทดลอง: เห็นเฉพาะออเดอร์จากเบราว์เซอร์นี้ — เชื่อม Supabase เพื่อรับออเดอร์จากมือถือลูกค้าจริง') : null,
    calls,
    h(
      'main',
      { class: 'k-board' },
      column('new', 'orders', 'ออเดอร์ใหม่', byStatus('รับออเดอร์')),
      column('cooking', 'cooking', 'กำลังทำ', byStatus('กำลังทำ')),
      column('done', 'success', 'เสิร์ฟล่าสุด', done),
    ),
  )
}

// ---------- วงจรการทำงาน ----------
let wakeLock = null
async function keepScreenOn() {
  try {
    if ('wakeLock' in navigator && document.visibilityState === 'visible') {
      wakeLock = await navigator.wakeLock.request('screen')
    }
  } catch {
    /* บางเบราว์เซอร์ไม่รองรับ */
  }
}

function stop() {
  state.stop?.()
  state.stop = null
  wakeLock?.release?.().catch(() => {})
  wakeLock = null
}

function start() {
  stop()
  state.seenOrders = null
  state.seenCalls = null
  const unsubscribe = subscribeLive(refresh)
  const poll = setInterval(refresh, FALLBACK_POLL_MS)
  const tick = setInterval(render, 30000) // อัปเดตนาฬิกา/เวลารอ
  const onVisible = () => {
    if (document.visibilityState === 'visible') {
      refresh()
      keepScreenOn()
    }
  }
  const onOnline = () => refresh()
  document.addEventListener('visibilitychange', onVisible)
  window.addEventListener('online', onOnline)
  state.stop = () => {
    unsubscribe()
    clearInterval(poll)
    clearInterval(tick)
    document.removeEventListener('visibilitychange', onVisible)
    window.removeEventListener('online', onOnline)
  }
  keepScreenOn()
  render()
  refresh()
}

async function boot() {
  unlockAudio()
  const session = await api.auth.getSession().catch(() => null)
  if (session) start()
  else renderLogin()
}

boot()
