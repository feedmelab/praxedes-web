'use client'

import { useFormStatus } from 'react-dom'
import { cn } from '@/lib/utils'

export default function SubmitButton({
  children,
  pendingText,
  variant = 'solid',
  className,
}: {
  children: React.ReactNode
  pendingText?: string
  variant?: 'solid' | 'outline' | 'danger'
  className?: string
}) {
  const { pending } = useFormStatus()

  const variants = {
    solid: 'bg-accent text-bg hover:bg-accent/90',
    outline: 'border border-accent/50 text-accent hover:bg-accent hover:text-bg',
    danger: 'border border-red-500/50 text-red-400 hover:bg-red-500 hover:text-white',
  }

  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        'rounded-sm px-5 py-2.5 text-xs font-medium uppercase tracking-[0.2em]',
        'transition-all duration-300 disabled:opacity-40',
        variants[variant],
        className
      )}
    >
      {pending && pendingText ? pendingText : children}
    </button>
  )
}
