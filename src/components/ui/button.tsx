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
    default:
      'bg-cyan-600 text-white border border-cyan-500/40 shadow-lg shadow-cyan-500/25 hover:bg-cyan-500 hover:shadow-cyan-500/40',
    destructive:
      'bg-red-600 text-white border border-red-500/40 shadow-lg shadow-red-500/20 hover:bg-red-500',
    outline:
      'border border-slate-600/80 bg-white/[0.03] text-slate-200 hover:bg-white/[0.07] hover:border-slate-500 hover:text-white',
    ghost: 'text-slate-300 hover:bg-white/[0.06] hover:text-white',
  }
  const sizes: Record<string, string> = {
    default: 'h-10 px-4 py-2',
    sm: 'h-8 px-3 text-sm',
    lg: 'h-12 px-6 text-lg',
  }
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-150 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:opacity-50 disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  )
}
