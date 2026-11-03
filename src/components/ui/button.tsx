import * as React from 'react'

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(' ')
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
}

export function Button({ className, variant = 'default', size = 'default', ...props }: ButtonProps) {
  const variants: Record<string, string> = {
    default: 'bg-cyan-600 text-white hover:bg-cyan-700 shadow-lg shadow-cyan-500/20',
    destructive: 'bg-red-600 text-white hover:bg-red-700',
    outline: 'border border-slate-600 bg-transparent hover:bg-slate-800 text-slate-200',
    ghost: 'hover:bg-slate-800 text-slate-200',
  }
  const sizes: Record<string, string> = {
    default: 'h-10 px-4 py-2',
    sm: 'h-8 px-3 text-sm',
    lg: 'h-12 px-6 text-lg',
  }
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  )
}
