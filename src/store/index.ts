import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Lang } from '@/types'

// ─── App Store ────────────────────────────────────────────────────────────────

interface AppStore {
  // i18n
  lang: Lang
  setLang: (l: Lang) => void
  toggleLang: () => void

  // Theme
  theme: 'dark' | 'light'
  setTheme: (t: 'dark' | 'light') => void
  toggleTheme: () => void

  // Auth
  token: string | null
  isAdmin: boolean
  login: (token: string) => void
  logout: () => void
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // ── i18n ──────────────────────────────────────────────────────────────
      lang: 'en',
      setLang: (lang) => set({ lang }),
      toggleLang: () => set({ lang: get().lang === 'en' ? 'zh' : 'en' }),

      // ── Theme ─────────────────────────────────────────────────────────────
      theme: 'dark',
      setTheme: (theme) => {
        document.documentElement.setAttribute('data-theme', theme)
        set({ theme })
      },
      toggleTheme: () => {
        const next = get().theme === 'dark' ? 'light' : 'dark'
        document.documentElement.setAttribute('data-theme', next)
        set({ theme: next })
      },

      // ── Auth ──────────────────────────────────────────────────────────────
      token: null,
      isAdmin: false,
      login: (token) => set({ token, isAdmin: true }),
      logout: () => set({ token: null, isAdmin: false }),
    }),
    {
      name: 'turtlelet-app',
      // 只持久化这几个字段
      partialize: (s) => ({ lang: s.lang, theme: s.theme, token: s.token, isAdmin: s.isAdmin }),
      onRehydrateStorage: () => (state) => {
        if (state?.theme)
          document.documentElement.setAttribute('data-theme', state.theme)
      }
    }
  )
)
