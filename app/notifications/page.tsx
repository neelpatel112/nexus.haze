'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import MobileNav from '@/components/MobileNav'
import type { Profile } from '@/types'
import { formatDistanceToNowStrict } from 'date-fns'

interface Notification {
  id: string
  type: 'like' | 'retweet' | 'reply' | 'follow'
  actor: Profile
  tweet_content?: string
  tweet_id?: string
  created_at: string
}

export default function NotificationsPage() {
  const [currentUser, setCurrentUser] = useState<Profile | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'all' | 'mentions'>('all')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { window.location.replace('/auth'); return }
      supabase.from('profiles').select('*').eq('id', session.user.id).single()
        .then(({ data }) => { if (data) { setCurrentUser(data); loadNotifications(data.id) } })
    })
  }, [])

  async function loadNotifications(uid: string) {
    setLoading(true)
    const notifs: Notification[] = []

    // Likes on my tweets
    const { data: likes } = await supabase
      .from('likes')
      .select('*, profiles!likes_user_id_fkey(*), tweets!likes_tweet_id_fkey(content, id)')
      .eq('tweets.user_id', uid)
      .neq('user_id', uid)
      .order('created_at', { ascending: false })
      .limit(10)

    likes?.forEach((l: any) => {
      if (l.profiles && l.tweets) {
        notifs.push({
          id: 'like-' + l.id,
          type: 'like',
          actor: l.profiles,
          tweet_content: l.tweets.content,
          tweet_id: l.tweets.id,
          created_at: l.created_at,
        })
      }
    })

    // Retweets of my tweets
    const { data: rts } = await supabase
      .from('retweets')
      .select('*, profiles!retweets_user_id_fkey(*), tweets!retweets_tweet_id_fkey(content, id)')
      .eq('tweets.user_id', uid)
      .neq('user_id', uid)
      .order('created_at', { ascending: false })
      .limit(10)

    rts?.forEach((r: any) => {
      if (r.profiles && r.tweets) {
        notifs.push({
          id: 'rt-' + r.id,
          type: 'retweet',
          actor: r.profiles,
          tweet_content: r.tweets.content,
          tweet_id: r.tweets.id,
          created_at: r.created_at,
        })
      }
    })

    // New followers
    const { data: follows } = await supabase
      .from('follows')
      .select('*, profiles!follows_follower_id_fkey(*)')
      .eq('following_id', uid)
      .neq('follower_id', uid)
      .order('created_at', { ascending: false })
      .limit(10)

    follows?.forEach((f: any) => {
      if (f.profiles) {
        notifs.push({
          id: 'follow-' + f.id,
          type: 'follow',
          actor: f.profiles,
          created_at: f.created_at,
        })
      }
    })

    // Sort all by date
    notifs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    setNotifications(notifs)
    setLoading(false)
  }

  const iconFor = (type: Notification['type']) => {
    switch (type) {
      case 'like':    return <svg viewBox="0 0 24 24" className="w-6 h-6 fill-x-pink text-x-pink fill-current"><path d="M20.884 13.19c-1.351 2.48-4.001 5.12-8.379 7.67l-.505.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z"/></svg>
      case 'retweet': return <svg viewBox="0 0 24 24" className="w-6 h-6 text-x-green fill-current"><path d="M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.79-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.209 0 4 1.79 4 4v8.45l2.068-1.93 1.364 1.46-4.432 4.14-4.432-4.14 1.364-1.46 2.068 1.93V8c0-1.1-.896-2-2-2z"/></svg>
      case 'follow':  return <svg viewBox="0 0 24 24" className="w-6 h-6 text-x-blue fill-current"><path d="M17.863 13.44c1.477 1.58 2.366 3.8 2.632 6.46l.11 1.1H3.395l.11-1.1c.266-2.66 1.155-4.88 2.632-6.46C7.627 11.85 9.648 11 12 11s4.373.85 5.863 2.44zM12 2C9.791 2 8 3.79 8 6s1.791 4 4 4 4-1.79 4-4-1.791-4-4-4z"/></svg>
      case 'reply':   return <svg viewBox="0 0 24 24" className="w-6 h-6 text-x-blue fill-current"><path d="M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.96-1.607 5.68-4.196 7.11l-8.054 4.46v-3.69h-.067c-4.49.1-8.183-3.51-8.183-8.01z"/></svg>
    }
  }

  const textFor = (n: Notification) => {
    switch (n.type) {
      case 'like':    return <><strong>{n.actor.display_name || n.actor.username}</strong> liked your post</>
      case 'retweet': return <><strong>{n.actor.display_name || n.actor.username}</strong> reposted your post</>
      case 'follow':  return <><strong>{n.actor.display_name || n.actor.username}</strong> followed you</>
      case 'reply':   return <><strong>{n.actor.display_name || n.actor.username}</strong> replied to your post</>
    }
  }

  return (
    <div className="flex min-h-screen bg-x-black">
      <Sidebar active="notifications"/>
      <main className="flex-1 border-x border-x-border max-w-[600px] min-h-screen pb-16 md:pb-0">

        <div className="sticky top-0 z-10 bg-x-black/80 backdrop-blur-md border-b border-x-border px-4 py-4">
          <h2 className="text-x-light font-bold text-xl">Notifications</h2>
          <div className="flex mt-3 -mx-4 border-b border-x-border">
            {(['all', 'mentions'] as const).map(t => (
              <button key={t}
                className={`flex-1 py-3 text-sm font-semibold capitalize transition-colors
                  ${tab === t ? 'text-x-light border-b-2 border-x-blue' : 'text-x-gray hover:bg-white/5'}`}
                onClick={() => setTab(t)}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-3 px-4 py-3 border-b border-x-border animate-pulse">
                <div className="w-10 h-10 rounded-full bg-x-surface flex-shrink-0"/>
                <div className="flex-1 space-y-2 pt-1">
                  <div className="h-3 bg-x-surface rounded w-2/3"/>
                  <div className="h-3 bg-x-surface rounded w-1/2"/>
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-center px-8">
            <p className="text-x-light font-bold text-2xl">Nothing to see here — yet</p>
            <p className="text-x-gray text-sm">When someone likes, reposts, or follows you, it'll show up here.</p>
          </div>
        ) : (
          notifications.map(n => {
            const letter = (n.actor.username || 'U')[0].toUpperCase()
            return (
              <div key={n.id}
                className="flex gap-3 px-4 py-3 border-b border-x-border hover:bg-x-surface/30 transition-colors cursor-pointer"
                onClick={() => { if (n.tweet_id) window.location.href = `/tweet/${n.tweet_id}`; else window.location.href = `/profile/${n.actor.id}` }}>
                <div className="flex flex-col items-center gap-1 flex-shrink-0">
                  {iconFor(n.type)}
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-x-blue to-purple-500
                                  flex items-center justify-center text-white font-bold text-xs overflow-hidden">
                    {n.actor.avatar_url ? <img src={n.actor.avatar_url} className="w-full h-full object-cover" alt="avatar"/> : letter}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-x-light text-sm">{textFor(n)}</p>
                  {n.tweet_content && (
                    <p className="text-x-gray text-sm mt-1 line-clamp-2">{n.tweet_content}</p>
                  )}
                  <p className="text-x-gray text-xs mt-1">
                    {formatDistanceToNowStrict(new Date(n.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            )
          })
        )}
      </main>
      <MobileNav active="notifications"/>
    </div>
  )
}
 