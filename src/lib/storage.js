// localStorage แบบปลอดภัย: ไม่ throw ในโหมดส่วนตัว / เมื่อพื้นที่เต็ม / เมื่อข้อมูลเสีย

export function readJSON(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

export function remove(key) {
  try {
    localStorage.removeItem(key)
  } catch {
    /* ignore */
  }
}
