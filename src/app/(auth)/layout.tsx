import type { Metadata } from 'next'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import '@/app/globals.css'

export const metadata: Metadata = {
  title: 'Mentis – Auth',
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <ThemeProvider>
          <main className="min-h-screen grid place-items-center p-6">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  )
}


