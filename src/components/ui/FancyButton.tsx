"use client"
import { cn } from '@/lib/utils'

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }
export function FancyButton({ className, ...props }: Props) {
  return (
    <button
      {...props}
      className={cn(
        "relative inline-flex items-center justify-center rounded-2xl px-4 py-2 font-medium text-white overflow-hidden",
        "bg-[linear-gradient(135deg,#006BFF_0%,#22D3EE_100%)] shadow-sm",
        "transition-[transform,box-shadow] duration-200 ease-[cubic-bezier(.2,.8,.2,1)]",
        "hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[hsl(var(--brand))]",
        className
      )}
    >
      <span className="relative z-10">{props.children}</span>
      <span className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 bg-white/10 hover:opacity-10" />
      <span className="pointer-events-none absolute -inset-10 rounded-full bg-white/20 opacity-0 blur-2xl transition duration-200 active:opacity-40" />
    </button>
  )
}


