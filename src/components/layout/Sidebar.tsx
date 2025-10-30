// src/components/layout/Sidebar.tsx
"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Home, Settings, LogOut } from "lucide-react"

export function Sidebar() {
  const pathname = usePathname()
  const isActive = (href: string) => pathname?.startsWith(href)

  const base = "flex items-center gap-3 px-3 py-2 rounded-xl transition hover:bg-gray-100"
  const active = "bg-gray-100 text-gray-900"

  return (
    <aside className="hidden md:flex h-full w-56 flex-col bg-white text-gray-800 p-4 border-r border-gray-200">
      {/* Logo uniquement dans la Topbar pour éviter les doublons */}

      <nav className="space-y-1">
        <Link href="/dashboard" className={cn(base, isActive("/dashboard") && active)}>
          <Home className="h-4 w-4" />
          <span>Dashboard</span>
        </Link>
        <Link href="/settings" className={cn(base, isActive("/settings") && active)}>
          <Settings className="h-4 w-4" />
          <span>Settings</span>
        </Link>
      </nav>

      <div className="mt-auto pt-6 border-t border-gray-200">
        <button
          onClick={async () => {
            const { supabaseClient } = await import("@/lib/supabase-browser")
            await supabaseClient.auth.signOut()
            window.location.href = "/login"
          }}
          className={base}
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}


