'use client'

import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import type { Profile } from '@/types'

const XLogo = () => (
  <svg viewBox="0 0 24 24" className="w-7 h-7 fill-current text-x-light">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.74l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
)

export default function Sidebar({ active }: { active?: string }) {
  const [profile, setProfile] = useState<Profile | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return
      supabase.from('profiles').select('*').eq('id', session.user.id).single()
        .then(({ data }) => { if (data) setProfile(data) })
    })
  }, [])

  async function logout() {
    await supabase.auth.signOut()
    window.location.href = '/auth'
  }

  const letter = (profile?.username || 'U')[0].toUpperCase()

  return (
    <aside className="hidden md:flex flex-col h-screen sticky top-0 w-20 xl:w-64 px-2 xl:px-4 py-4 justify-between">
      <div className="flex flex-col gap-1">

        {/* Logo */}
        <a href="/" className="p-3 rounded-full hover:bg-x-surface w-fit mb-2 transition-colors">
          <XLogo />
        </a>

        {/* Nav links */}
        {[
          { href: '/', label: 'Home', icon: (
            <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
              <path d="M21.591 7.146L12.52 1.157c-.316-.21-.724-.21-1.04 0l-9.071 5.99c-.26.173-.409.456-.409.757v13.06c0 .502.418.92.92.92H8.28c.502 0 .92-.418.92-.92v-5.7h5.6v5.7c0 .502.418.92.92.92h5.38c.502 0 .92-.418.92-.92V7.903c0-.301-.158-.584-.408-.757z"/>
            </svg>
          )},
          { href: '/explore', label: 'Explore', icon: (
            <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
              <path d="M10.25 3.75c-3.59 0-6.5 2.91-6.5 6.5s2.91 6.5 6.5 6.5c1.795 0 3.419-.726 4.596-1.904 1.178-1.177 1.904-2.801 1.904-4.596 0-3.59-2.91-6.5-6.5-6.5zm-8.5 6.5c0-4.694 3.806-8.5 8.5-8.5s8.5 3.806 8.5 8.5c0 1.986-.682 3.815-1.814 5.262l4.276 4.276-1.414 1.414-4.276-4.276C13.815 19.318 11.986 20 10.25 20c-4.694 0-8.5-3.806-8.5-8.5z"/>
            </svg>
          )},
          { href: '/notifications', label: 'Notifications', icon: (
            <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
              <path d="M11.996 2c-4.062 0-7.49 3.021-7.999 7.051L2.866 14H1v2h3.086l.21-1.369.806-5.216C5.473 6.36 8.054 4 11.996 4s6.523 2.36 6.994 5.415l.806 5.216.21 1.369H23v-2h-1.866l-1.131-7.295C19.503 5.021 16.075 2 11.996 2zM9 19c0 .603.236 1.178.659 1.607C10.086 21.043 11 21.5 12 21.5s1.914-.457 2.341-1.393A2.27 2.27 0 0 0 15 19H9z"/>
            </svg>
          )},
          { href: '/messages', label: 'Messages', icon: (
            <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
              <path d="M1.998 5.5c0-1.381 1.119-2.5 2.5-2.5h15c1.381 0 2.5 1.119 2.5 2.5v13c0 1.381-1.119 2.5-2.5 2.5h-15c-1.381 0-2.5-1.119-2.5-2.5v-13zm2.5-.5c-.276 0-.5.224-.5.5v2.764l8 3.638 8-3.638V5.5c0-.276-.224-.5-.5-.5h-15zm15.5 5.463l-7.5 3.413-7.5-3.413V18.5c0 .276.224.5.5.5h14c0 0 .5 0 .5-.5v-8.037z"/>
            </svg>
          )},
          { href: `/profile/${profile?.id || ''}`, label: 'Profile', icon: (
            <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
              <path d="M5.651 19h12.698c-.337-1.8-1.023-3.21-1.945-4.19C15.318 13.65 13.838 13 12 13s-3.317.65-4.404 1.81c-.922.98-1.608 2.39-1.945 4.19zm.486-5.56C7.627 11.85 9.648 11 12 11s4.373.85 5.863 2.44c1.477 1.58 2.366 3.8 2.632 6.46l.11 1.1H3.395l.11-1.1c.266-2.66 1.155-4.88 2.632-6.46zM12 4c-1.105 0-2 .9-2 2s.895 2 2 2 2-.9 2-2-.895-2-2-2zM8 6c0-2.21 1.791-4 4-4s4 1.79 4 4-1.791 4-4 4-4-1.79-4-4z"/>
            </svg>
          )},
        ].map(item => (
          <a key={item.href} href={item.href}
            className={`sidebar-link ${active === item.label.toLowerCase() ? 'font-bold' : ''}`}
          >
            {item.icon}
            <span className="hidden xl:block">{item.label}</span>
          </a>
        ))}

        {/* Tweet button */}
        <a href="/compose"
          className="mt-4 bg-x-blue hover:bg-x-blue-hover text-white font-bold rounded-full
                     flex items-center justify-center gap-2 py-3 px-4 transition-colors
                     xl:w-full w-12 h-12 xl:h-auto"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current xl:hidden">
            <path d="M23 3c-6.62-.1-10.38 2.421-13.05 6.03C7.29 12.61 6 17.331 6 22h2c0-1.007.07-2.012.19-3H12c4.1 0 7.48-3.082 7.48-6.8 0-1.106-.309-2.027-.86-2.868-.ints 0 0-.98-1.775-2.06-2.332C18.698 6.45 19 5.736 19 5c0-1.12-.9-2-2-2-.586 0-1.115.24-1.498.625C14.184 3.25 12.5 3 12 3H8c-1.657 0-3 1.343-3 3v1H3c-1.1 0-2 .9-2 2v1c0 1.1.9 2 2 2h2v-1c0-.552.448-1 1-1h1v-1c0-.552.448-1 1-1h3c.5 0 1.89.246 3.195.59z"/>
          </svg>
          <span className="hidden xl:block text-base">Post</span>
        </a>
      </div>

      {/* Profile pill */}
      {profile && (
        <button onClick={logout}
          className="flex items-center gap-3 px-3 py-3 rounded-full hover:bg-x-surface
                     transition-colors w-full text-left"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-x-blue to-purple-500
                          flex items-center justify-center text-white font-bold text-sm flex-shrink-0 overflow-hidden">
            {profile.avatar_url
              ? <img src={profile.avatar_url} className="w-full h-full object-cover" alt="avatar"/>
              : letter}
          </div>
          <div className="hidden xl:flex flex-col min-w-0 flex-1">
            <span className="text-x-light font-bold text-sm truncate">{profile.display_name || profile.username}</span>
            <span className="text-x-gray text-sm truncate">@{profile.username}</span>
          </div>
          <span className="hidden xl:block text-x-gray text-lg">···</span>
        </button>
      )}
    </aside>
  )
    }
            
