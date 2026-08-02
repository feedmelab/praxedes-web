'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'

export type CartItem = {
  itemId: string
  nameEs: string
  nameEn: string
  image: string | null
  stock: number
  quantity: number
}

type CartCtx = {
  items: CartItem[]
  count: number
  add: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void
  remove: (itemId: string) => void
  setQty: (itemId: string, quantity: number) => void
  clear: () => void
  has: (itemId: string) => boolean
}

const Ctx = createContext<CartCtx | null>(null)
const KEY = 'px-rental-cart'

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [ready, setReady] = useState(false)

  // Cargar de localStorage al montar.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY)
      if (raw) setItems(JSON.parse(raw))
    } catch {
      /* noop */
    }
    setReady(true)
  }, [])

  // Persistir cuando cambie (tras la carga inicial).
  useEffect(() => {
    if (!ready) return
    try {
      localStorage.setItem(KEY, JSON.stringify(items))
    } catch {
      /* noop */
    }
  }, [items, ready])

  const add: CartCtx['add'] = useCallback((item, quantity = 1) => {
    setItems((prev) => {
      const found = prev.find((x) => x.itemId === item.itemId)
      const max = Math.max(1, item.stock)
      if (found) {
        return prev.map((x) =>
          x.itemId === item.itemId ? { ...x, quantity: Math.min(max, x.quantity + quantity) } : x
        )
      }
      return [...prev, { ...item, quantity: Math.min(max, Math.max(1, quantity)) }]
    })
  }, [])

  const remove: CartCtx['remove'] = useCallback((itemId) => {
    setItems((prev) => prev.filter((x) => x.itemId !== itemId))
  }, [])

  const setQty: CartCtx['setQty'] = useCallback((itemId, quantity) => {
    setItems((prev) =>
      prev.map((x) =>
        x.itemId === itemId ? { ...x, quantity: Math.max(1, Math.min(x.stock, quantity || 1)) } : x
      )
    )
  }, [])

  const clear = useCallback(() => setItems([]), [])
  const has = useCallback((itemId: string) => items.some((x) => x.itemId === itemId), [items])

  const count = items.reduce((n, x) => n + x.quantity, 0)

  return (
    <Ctx.Provider value={{ items, count, add, remove, setQty, clear, has }}>
      {children}
    </Ctx.Provider>
  )
}

export function useCart() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useCart debe usarse dentro de <CartProvider>')
  return ctx
}
