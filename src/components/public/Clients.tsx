'use client'

import { useEffect, useState } from 'react'
import { CLIENTS_LIMIT } from '@/lib/clients'

// Muestra un subconjunto de clientes; si hay más del límite, elige unos cuantos
// AL AZAR en cada carga de la página (se re-baraja al montar en el cliente).
export default function Clients({
  clients,
  limit = CLIENTS_LIMIT,
}: {
  clients: string[]
  limit?: number
}) {
  const [shown, setShown] = useState(() => clients.slice(0, limit))

  useEffect(() => {
    if (clients.length <= limit) {
      setShown(clients)
      return
    }
    const a = [...clients]
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[a[i], a[j]] = [a[j], a[i]]
    }
    setShown(a.slice(0, limit))
  }, [clients, limit])

  return (
    <>
      {shown.map((c) => (
        <span
          key={c}
          className="cursor-default transition-colors duration-500 ease-out-expo hover:text-light"
        >
          {c}
        </span>
      ))}
    </>
  )
}
