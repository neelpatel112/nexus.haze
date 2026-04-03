import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'X — It\'s what\'s happening',
  description: 'Twitter/X clone built with Next.js + TypeScript + Supabase',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-x-black text-x-light min-h-screen">
        {children}
      </body>
    </html>
  )
}
