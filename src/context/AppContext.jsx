import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const AppContext = createContext(null)
export const useApp = () => useContext(AppContext)

const LS_TABLE = 'th_table'
const LS_ADMIN = 'th_admin'
const LS_CART = 'th_cart'

export function AppProvider({ children }) {
  // ป้ายโต๊ะของลูกค้า เช่น "โต๊ะที่ 01" หรือ "สั่งกลับบ้าน"
  const [tableLabel, setTableLabel] = useState(
    () => localStorage.getItem(LS_TABLE) || 'โต๊ะที่ 01',
  )
  const [isAdmin, setIsAdmin] = useState(
    () => localStorage.getItem(LS_ADMIN) === '1',
  )
  const [cart, setCart] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(LS_CART)) || []
    } catch {
      return []
    }
  })

  useEffect(() => localStorage.setItem(LS_TABLE, tableLabel), [tableLabel])
  useEffect(
    () => localStorage.setItem(LS_ADMIN, isAdmin ? '1' : '0'),
    [isAdmin],
  )
  useEffect(() => localStorage.setItem(LS_CART, JSON.stringify(cart)), [cart])

  const loginAdmin = (password) => {
    const expected = import.meta.env.VITE_ADMIN_PASSWORD || 'admin1234'
    if (password === expected) {
      setIsAdmin(true)
      return true
    }
    return false
  }
  const logoutAdmin = () => setIsAdmin(false)

  // ---- ตะกร้า ----
  const addToCart = (item) => {
    setCart((prev) => {
      const found = prev.find((c) => c.id === item.id)
      if (found)
        return prev.map((c) =>
          c.id === item.id ? { ...c, qty: c.qty + 1 } : c,
        )
      return [...prev, { ...item, qty: 1 }]
    })
  }
  const setQty = (id, qty) =>
    setCart((prev) =>
      qty <= 0
        ? prev.filter((c) => c.id !== id)
        : prev.map((c) => (c.id === id ? { ...c, qty } : c)),
    )
  const clearCart = () => setCart([])
  const cartCount = cart.reduce((s, c) => s + c.qty, 0)
  const cartTotal = cart.reduce((s, c) => s + c.price * c.qty, 0)

  const value = useMemo(
    () => ({
      tableLabel,
      setTableLabel,
      isAdmin,
      loginAdmin,
      logoutAdmin,
      cart,
      addToCart,
      setQty,
      clearCart,
      cartCount,
      cartTotal,
    }),
    [tableLabel, isAdmin, cart, cartCount, cartTotal],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
