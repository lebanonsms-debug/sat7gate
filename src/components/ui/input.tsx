import * as React from 'react'

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(' ')
}

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'flex h-11 sm:h-10 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 sm:px-4 py-2 text-base sm:text-sm text-slate-100 placeholder:text-slate-500 transition-colors focus:outline-none focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20 disabled:opacity-50',
        className
      )}
      {...props}
    />
  )
}
