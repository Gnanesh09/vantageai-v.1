import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Header from '@/components/Header'
import CategoryStrip from '@/components/CategoryStrip'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'SwiftCart | Premier E-Commerce',
  description: '10-minute grocery delivery app',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans bg-background text-foreground`}>
        <Header />
        <main className="pb-20">
          {children}
        </main>
      </body>
    </html>
  )
}
