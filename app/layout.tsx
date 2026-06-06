import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import NavBar from '@/components/NavBar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'PlayFinder — Rate Kids Playgrounds',
  description: 'Discover and rate kids playgrounds near you across North America',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-white text-gray-900 min-h-screen`}>
        <NavBar />
        <main className="pt-14 bg-white">{children}</main>
      </body>
    </html>
  )
}
