import type { Metadata } from 'next'
import { Bricolage_Grotesque, Hanken_Grotesk, Spline_Sans_Mono } from 'next/font/google'
import './globals.css'
import NavBar from '@/components/NavBar'

const display = Bricolage_Grotesque({ subsets: ['latin'], variable: '--font-bricolage' })
const body = Hanken_Grotesk({ subsets: ['latin'], variable: '--font-hanken' })
const mono = Spline_Sans_Mono({ subsets: ['latin'], variable: '--font-spline-mono', weight: ['500', '600'] })

export const metadata: Metadata = {
  title: 'PlayFinder — Rate Kids Playgrounds',
  description: 'Discover and rate kids playgrounds near you across North America',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${body.variable} ${mono.variable} font-body bg-sand text-ink min-h-screen`}>
        <NavBar />
        <main className="pt-14">{children}</main>
      </body>
    </html>
  )
}
