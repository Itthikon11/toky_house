import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { LIMITS, STORAGE_KEYS } from '../config/constants'
import { readJSON, writeJSON } from '../lib/storage'

const CartContext = createContext(null)
export const useCart = () => useContext(CartContext)

const clampQty = (n) => Math.max(0, Math.min(LIMITS.MAX_QTY_PER_LINE, Math.floor(Number(n) || 0)))

function loadCart() {
  const raw = readJSON(STORAGE_KEYS.CART, [])
  return Array.isArray(raw)
    ? raw.filter((c) => c && typeof c.id === 'string' && clampQty(c.qty) > 0)
    : []
}

export function CartProvider({ children }) {
  const [cart, setCart] = useState(loadCart)

  useEffect(() => {
    writeJSON(STORAGE_KEYS.CART, cart)
  }, [cart])

  const addToCart = useCallback((item) => {
    setCart((prev) => {
      const found = prev.find((c) => c.id === item.id)
      if (found) {
        return prev.map((c) => (c.id === item.id ? { ...c, qty: clampQty(c.qty + 1) } : c))
      }
      if (prev.length >= LIMITS.MAX_LINES_PER_ORDER) return prev
      const { id, name, price, image } = item
      return [...prev, { id, name, price, image, qty: 1 }]
    })
  }, [])

  const setQty = useCallback(
    (id, qty) =>
      setCart((prev) => {
        const q = clampQty(qty)
        return q === 0 ? prev.filter((c) => c.id !== id) : prev.map((c) => (c.id === id ? { ...c, qty: q } : c))
      }),
    [],
  )

  const removeItem = useCallback((id) => setCart((prev) => prev.filter((c) => c.id !== id)), [])
  const clearCart = useCallback(() => setCart([]), [])

  const value = useMemo(
    () => ({
      cart,
      addToCart,
      setQty,
      removeItem,
      clearCart,
      cartCount: cart.reduce((s, c) => s + c.qty, 0),
      // ยอดนี้ใช้แสดงผลเท่านั้น — ยอดจริงคำนวณที่ฐานข้อมูล
      cartTotal: cart.reduce((s, c) => s + c.price * c.qty, 0),
    }),
    [cart, addToCart, setQty, removeItem, clearCart],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
