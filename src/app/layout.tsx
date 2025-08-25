import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { PreferencesProvider } from '@/contexts/PreferencesContext'
import { KeyboardShortcutsProvider } from '@/contexts/KeyboardShortcutsContext'
import { ThemeWrapper } from '@/components/shared/ThemeWrapper'
import { KeyboardShortcutsHelp } from '@/components/shared/KeyboardShortcutsHelp'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'App Studio',
  description: 'A unified, local-first platform for custom-built productivity tools',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <PreferencesProvider>
          <KeyboardShortcutsProvider>
            <ThemeWrapper>
              {children}
              <KeyboardShortcutsHelp />
            </ThemeWrapper>
          </KeyboardShortcutsProvider>
        </PreferencesProvider>
      </body>
    </html>
  )
}