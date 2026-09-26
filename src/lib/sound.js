// เสียงแจ้งเตือนสั้น ๆ (สร้างด้วย Web Audio ไม่ต้องโหลดไฟล์เสียง)
import { readJSON, writeJSON } from './storage'

const SOUND_KEY = 'th_sound_on'
let ctx = null

// เปิด/ปิดเสียงแจ้งเตือน (จำไว้ในเครื่องนี้)
export const isSoundOn = () => readJSON(SOUND_KEY, true) !== false
export const setSoundOn = (on) => writeJSON(SOUND_KEY, !!on)

function getCtx() {
  const AC = window.AudioContext || window.webkitAudioContext
  if (!AC) return null
  if (!ctx) ctx = new AC()
  if (ctx.state === 'suspended') ctx.resume().catch(() => {})
  return ctx
}

// เบราว์เซอร์ต้องให้ผู้ใช้แตะหน้าจอก่อน 1 ครั้งจึงจะเล่นเสียงได้
export function unlockAudio() {
  const once = () => {
    getCtx()
    window.removeEventListener('pointerdown', once)
    window.removeEventListener('keydown', once)
  }
  window.addEventListener('pointerdown', once)
  window.addEventListener('keydown', once)
}

export function playChime(kind = 'order', { force = false } = {}) {
  if (!force && !isSoundOn()) return
  const ac = getCtx()
  if (!ac) return
  const notes = kind === 'call' ? [880, 660, 880, 660] : [660, 880, 1100]
  notes.forEach((freq, i) => {
    const t = ac.currentTime + i * 0.16
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.exponentialRampToValueAtTime(0.3, t + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.15)
    osc.connect(gain).connect(ac.destination)
    osc.start(t)
    osc.stop(t + 0.16)
  })
}
