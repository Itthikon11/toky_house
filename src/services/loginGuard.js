// ล็อกการเข้าสู่ระบบชั่วคราวเมื่อใส่รหัสผิดติดกันหลายครั้ง
import { LIMITS, STORAGE_KEYS } from '../config/constants'
import { readJSON, remove, writeJSON } from '../lib/storage'
import { AppError, errorCode } from './errors'
import { api } from './api'

const read = () => readJSON(STORAGE_KEYS.LOGIN_GUARD, { fails: 0, lockedUntil: 0 })

export function lockRemainingSec() {
  return Math.max(0, Math.ceil((read().lockedUntil - Date.now()) / 1000))
}

export async function guardedSignIn(credentials) {
  if (lockRemainingSec() > 0) throw new AppError('LOCKED')
  try {
    const session = await api.auth.signIn(credentials)
    remove(STORAGE_KEYS.LOGIN_GUARD)
    return session
  } catch (e) {
    if (errorCode(e) === 'BAD_CREDENTIALS') {
      const fails = read().fails + 1
      writeJSON(
        STORAGE_KEYS.LOGIN_GUARD,
        fails >= LIMITS.LOGIN_MAX_ATTEMPTS
          ? { fails: 0, lockedUntil: Date.now() + LIMITS.LOGIN_LOCK_MINUTES * 60000 }
          : { fails, lockedUntil: 0 },
      )
    }
    throw e
  }
}
