'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import MobileNav from '@/components/MobileNav'
import TweetCard from '@/components/TweetCard'
import TweetBox from '@/components/TweetBox'
import type { Tweet, Profile } from '@/types'

export default function HomePage() {
  const [tweets, setTweets]       = useState<Tweet[]>([])
  const [profile, setProfile]     = useState<Profile | null>(null)
  const [likedIds, setLikedIds]   = useState<Set<string>>(new Set())
  const [rtIds, setRtIds]         = useState<Set<string>>(new Set())
  const [loading, setLoading]     = useState(true)
  const [tab, setTab]             = useState<'for-you' | 'following'>('for-you')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { window.location.href = '/auth'; return }
      loadProfile(session.user.id)
    })
  }, [])

  async function loadProfile(uid: string) {
    const { data } = await supabase.from('profiles').select('*').eq('id', uid).single()
    if (data) setProfile(data)
    loadTweets(uid)
    loadInteractions(uid)
  }

  const loadTweets = useCallback(async (_uid?: string) => {
    setLoading(true)
    const { data } = await supabase
      .from('tweets')
      .select('*, profiles(*)')
      .order('created_at', { ascending: false })
      .limit(30)
    setTweets(data || [])
    setLoading(false)
  }, [])

  async function loadInteractions(uid: string) {
    const [{ data: likes }, { data: rts }] = await Promise.all([
      supabase.from('likes').select('tweet_id').eq('user_id', uid),
      supabase.from('retweets').select('tweet_id').eq('user_id', uid),
    ])
    setLikedIds(new Set((likes || []).map(l => l.tweet_id)))
    setRtIds(new Set((rts || []).map(r => r.tweet_id)))
  }

  return (
    <div className="flex min-h-screen bg-x-black">
      <Sidebar active="home" />

      <main className="flex-1 border-x border-x-border max-w-[600px] min-h-screen pb-16 md:pb-0">

        {/* Header */}
        <div className="sticky top-0 z-10 bg-x-black/80 backdrop-blur-md border-b border-x-border">
          <div className="flex">
            {['for-you', 'following'].map(t => (
              <button key={t}
                className={`flex-1 py-4 text-sm font-semibold transition-colors
                  ${tab === t ? 'text-x-light border-b-2 border-x-blue' : 'text-x-gray hover:text-x-light hover:bg-white/5'}`}
                onClick={() => setTab(t as typeof tab)}
              >
                {t === 'for-you' ? 'For you' : 'Following'}
              </button>
            ))}
          </div>
        </div>

        {/* Compose box */}
        {profile && <TweetBox profile={profile} onTweet={() => loadTweets(profile.id)} />}

        {/* Feed */}
        {loading ? (
          <div className="flex flex-col">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-3 px-4 py-3 border-b border-x-border animate-pulse">
                <div className="w-10 h-10 rounded-full bg-x-surface flex-shrink-0"/>
                <div className="flex-1 space-y-2 pt-1">
                  <div className="h-3 bg-x-surface rounded w-1/3"/>
                  <div className="h-3 bg-x-surface rounded w-full"/>
                  <div className="h-3 bg-x-surface rounded w-2/3"/>
                </div>
              </div>
            ))}
          </div>
        ) : tweets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-x-gray">
            <svg viewBox="0 0 24 24" className="w-16 h-16 fill-current opacity-30">
              <path d="M23 3c-6.62-.1-10.38 2.421-13.05 6.03C7.29 12.61 6 17.331 6 22h2c0-1.007.07-2.012.19-3H12c4.1 0 7.48-3.082 7.48-6.8 0-1.106-.309-2.027-.86-2.868-.ints 0 0-.98-1.775-2.06-2.332C18.698 6.45 19 5.736 19 5c0-1.12-.9-2-2-2-.586 0-1.115.24-1.498.625C14.184 3.25 12.5 3 12 3H8c-1.657 0-3 1.343-3 3v1H3c-1.1 0-2 .9-2 2v1c0 1.1.9 2 2 2h2v-1c0-.552.448-1 1-1h1v-1c0-.552.448-1 1-1h3c.5 0 1.89.246 3.195.59z"/>
            </svg>
            <p className="text-xl font-bold text-x-light">Welcome to X!</p>
            <p className="text-sm text-center px-8">Post your first tweet above and it'll appear here.</p>
          </div>
        ) : (
          tweets.map(tweet => (
            <TweetCard
              key={tweet.id}
              tweet={tweet}
              currentUserId={profile?.id}
              initialLiked={likedIds.has(tweet.id)}
              initialRetweeted={rtIds.has(tweet.id)}
            />
          ))
        )}
      </main>

      {/* Right sidebar — trending (desktop) */}
      <aside className="hidden lg:block w-80 px-6 py-4 sticky top-0 h-screen overflow-y-auto">
        <div className="bg-x-surface rounded-2xl p-4 mb-4">
          <input
            className="w-full bg-x-black rounded-full px-4 py-2 text-sm text-x-light
                       placeholder:text-x-gray outline-none border border-transparent
                       focus:border-x-blue transition-colors"
            placeholder="Search"
            onKeyDown={e => { if (e.key === 'Enter') window.location.href = `/explore?q=${(e.target as HTMLInputElement).value}` }}
          />
        </div>

        <div className="bg-x-surface rounded-2xl overflow-hidden">
          <h2 className="text-x-light font-bold text-lg px-4 pt-4 pb-2">Trends for you</h2>
          {['#NextJS', '#TypeScript', '#Supabase', '#WebDev', '#OpenSource'].map((tag, i) => (
            <div key={tag} className="px-4 py-3 hover:bg-white/5 cursor-pointer transition-colors border-t border-x-border">
              <p className="text-x-gray text-xs">Trending · Technology</p>
              <p className="text-x-light font-bold text-sm">{tag}</p>
              <p className="text-x-gray text-xs">{(Math.random() * 50 + 5).toFixed(1)}K posts</p>
            </div>
          ))}
        </div>
      </aside>

      <MobileNav active="home" />
    </div>
  )
    }
           
