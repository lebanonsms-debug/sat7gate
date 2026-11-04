import * as React from 'react'

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(' ')
}

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'flex h-12 sm:h-10 w-full rounded-lg border border-slate-600 bg-slate-900/50 px-3 sm:px-4 py-2 sm:py-2 text-base sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent disabled:opacity-50',
        className
      )}
      {...props}
    />
  )
}
