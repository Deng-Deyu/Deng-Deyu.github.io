import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Lang } from '@/types'

interface AppStore {
  lang: Lang; setLang:(l:Lang)=>void; toggleLang:()=>void
  theme:'dark'|'light'; setTheme:(t:'dark'|'light')=>void; toggleTheme:()=>void
  token:string|null; isAdmin:boolean; login:(t:string)=>void; logout:()=>void
  guestToken:string|null; guestNick:string; setGuest:(id:string,nick:string)=>void; clearGuest:()=>void
}

export const useAppStore = create<AppStore>()(
  persist(
    (set,get)=>({
      lang: 'zh',  // ← 默认中文
      setLang:(lang)=>set({lang}),
      toggleLang:()=>set({lang:get().lang==='en'?'zh':'en'}),
      theme:'dark',
      setTheme:(theme)=>{document.documentElement.setAttribute('data-theme',theme);set({theme})},
      toggleTheme:()=>{const n=get().theme==='dark'?'light':'dark';document.documentElement.setAttribute('data-theme',n);set({theme:n})},
      token:null,isAdmin:false,
      login:(token)=>set({token,isAdmin:true}),
      logout:()=>set({token:null,isAdmin:false}),
      guestToken:null,guestNick:'',
      setGuest:(id,nick)=>set({guestToken:id,guestNick:nick}),
      clearGuest:()=>set({guestToken:null,guestNick:''}),
    }),
    {
      name:'turtlelet-v4',
      partialize:(s)=>({lang:s.lang,theme:s.theme,token:s.token,isAdmin:s.isAdmin,guestToken:s.guestToken,guestNick:s.guestNick}),
      onRehydrateStorage:()=>(s)=>{if(s?.theme) document.documentElement.setAttribute('data-theme',s.theme)}
    }
  )
)
