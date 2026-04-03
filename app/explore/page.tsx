'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import MobileNav from '@/components/MobileNav'
import TweetCard from '@/components/TweetCard'
import type { Tweet, Profile } from '@/types'

const TRENDS = [
  { tag: '#NextJS',      category: 'Technology', posts: '48.2K' },
  { tag: '#TypeScript',  category: 'Technology', posts: '32.1K' },
  { tag: '#Supabase',    category: 'Technology', posts: '12.4K' },
  { tag: '#WebDev',      category: 'Technology', posts: '91.3K' },
  { tag: '#OpenSource',  category: 'Technology', posts: '27.8K' },
  { tag: '#React',       category: 'Technology', posts: '104K'  },
  { tag: '#TailwindCSS', category: 'Design',     posts: '18.5K' },
  { tag: '#Vercel',      category: 'Technology', posts: '9.3K'  },
]

export default function ExplorePage() {
  const [query, setQuery]         = useState('')
  const [results, setResults]     = useState<{ users: Profile[], tweets: Tweet[] }>({ users: [], tweets: [] })
  const [currentUserId, setCurrentUserId] = useState<string>()
  const [loading, setLoading]     = useState(false)
  const [tab, setTab]             = useState<'top' | 'people' | 'latest'>('top')
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout>()
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { window.location.replace('/auth'); return }
      setCurrentUserId(session.user.id)
      loadFollowing(session.user.id)
    })
  }, [])

  async function loadFollowing(uid: string) {
    const { data } = await supabase.from('follows').select('following_id').eq('follower_id', uid)
    setFollowingIds(new Set((data || []).map(f => f.following_id)))
  }

  function handleSearch(val: string) {
    setQuery(val)
    clearTimeout(searchTimeout)
    if (!val.trim()) { setResults({ users: [], tweets: [] }); return }
    const t = setTimeout(() => search(val.trim()), 350)
    setSearchTimeout(t)
  }

  async function search(q: string) {
    setLoading(true)
    const [{ data: users }, { data: tweets }] = await Promise.all([
      supabase.from('profiles').select('*').ilike('username', `%${q}%`).neq('id', currentUserId || '').limit(5),
      supabase.from('tweets').select('*, profiles(*)').ilike('content', `%${q}%`).order('created_at', { ascending: false }).limit(20),
    ])
    setResults({ users: users || [], tweets: tweets || [] })
    setLoading(false)
  }

  async function toggleFollow(userId: string) {
    if (!currentUserId) return
    const isFollowing = followingIds.has(userId)
    const newSet = new Set(followingIds)
    if (isFollowing) {
      newSet.delete(userId)
      await supabase.from('follows').delete().eq('follower_id', currentUserId).eq('following_id', userId)
      await supabase.rpc('decrement_followers', { target_id: userId })
      await supabase.rpc('decrement_following', { target_id: currentUserId })
    } else {
      newSet.add(userId)
      await supabase.from('follows').insert({ follower_id: currentUserId, following_id: userId })
      await supabase.rpc('increment_followers', { target_id: userId })
      await supabase.rpc('increment_following', { target_id: currentUserId })
    }
    setFollowingIds(newSet)
  }

  const hasResults = results.users.length > 0 || results.tweets.length > 0

  return (
    <div className="flex min-h-screen bg-x-black">
      <Sidebar active="explore"/>
      <main className="flex-1 border-x border-x-border max-w-[600px] min-h-screen pb-16 md:pb-0">

        {/* Search bar */}
        <div className="sticky top-0 z-10 bg-x-black/80 backdrop-blur-md px-4 py-3 border-b border-x-border">
          <div className="flex items-center gap-3 bg-x-surface rounded-full px-4 py-2 border border-transparent focus-within:border-x-blue transition-colors">
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-x-gray flex-shrink-0 text-x-gray fill-current">
              <path d="M10.25 3.75c-3.59 0-6.5 2.91-6.5 6.5s2.91 6.5 6.5 6.5c1.795 0 3.419-.726 4.596-1.904 1.178-1.177 1.904-2.801 1.904-4.596 0-3.59-2.91-6.5-6.5-6.5zm-8.5 6.5c0-4.694 3.806-8.5 8.5-8.5s8.5 3.806 8.5 8.5c0 1.986-.682 3.815-1.814 5.262l4.276 4.276-1.414 1.414-4.276-4.276C13.815 19.318 11.986 20 10.25 20c-4.694 0-8.5-3.806-8.5-8.5z"/>
            </svg>
            <input
              className="flex-1 bg-transparent text-x-light text-sm placeholder:text-x-gray outline-none"
              placeholder="Search"
              value={query}
              onChange={e => handleSearch(e.target.value)}
              autoFocus
            />
            {query && (
              <button onClick={() => { setQuery(''); setResults({ users: [], tweets: [] }) }}
                className="text-x-gray hover:text-x-light text-lg leading-none">✕</button>
            )}
          </div>

          {/* Search tabs */}
          {query && (
            <div className="flex mt-2 -mx-4 border-b border-x-border">
              {(['top', 'people', 'latest'] as const).map(t => (
                <button key={t}
                  className={`flex-1 py-3 text-sm font-semibold capitalize transition-colors
                    ${tab === t ? 'text-x-light border-b-2 border-x-blue' : 'text-x-gray hover:bg-white/5'}`}
                  onClick={() => setTab(t)}>
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Search results */}
        {query ? (
          loading ? (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 border-2 border-x-border border-t-x-blue rounded-full animate-spin"/>
            </div>
          ) : !hasResults ? (
            <div className="flex flex-col items-center py-16 px-8 gap-2 text-center">
              <p className="text-x-light font-bold text-2xl">No results for "{query}"</p>
              <p className="text-x-gray text-sm">Try searching for something else.</p>
            </div>
          ) : (
            <>
              {/* People results */}
              {(tab === 'top' || tab === 'people') && results.users.length > 0 && (
                <div className="border-b border-x-border">
                  {tab === 'top' && <h3 className="text-x-light font-bold px-4 py-3">People</h3>}
                  {results.users.map(user => {
                    const letter = (user.username || 'U')[0].toUpperCase()
                    const isFollowing = followingIds.has(user.id)
                    return (
                      <div key={user.id} className="flex items-center gap-3 px-4 py-3 hover:bg-x-surface/50 transition-colors">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-x-blue to-purple-500
                                        flex items-center justify-center text-white font-bold text-sm overflow-hidden flex-shrink-0 cursor-pointer"
                          onClick={() => window.location.href = `/profile/${user.id}`}>
                          {user.avatar_url ? <img src={user.avatar_url} className="w-full h-full object-cover" alt="avatar"/> : letter}
                        </div>
                        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => window.location.href = `/profile/${user.id}`}>
                          <p className="text-x-light font-bold text-sm truncate">{user.display_name || user.username}</p>
                          <p className="text-x-gray text-sm">@{user.username}</p>
                          {user.bio && <p className="text-x-light text-sm mt-1 line-clamp-2">{user.bio}</p>}
                        </div>
                        <button onClick={() => toggleFollow(user.id)}
                          className={`font-bold rounded-full px-4 py-1.5 text-sm transition-colors flex-shrink-0
                            ${isFollowing
                              ? 'border border-x-border text-x-light hover:border-red-500 hover:text-red-500'
                              : 'bg-x-light text-x-black hover:bg-x-light/90'}`}>
                          {isFollowing ? 'Following' : 'Follow'}
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Tweet results */}
              {(tab === 'top' || tab === 'latest') && results.tweets.length > 0 && (
                <div>
                  {tab === 'top' && results.users.length > 0 && (
                    <h3 className="text-x-light font-bold px-4 py-3 border-b border-x-border">Posts</h3>
                  )}
                  {results.tweets.map(t => (
                    <TweetCard key={t.id} tweet={t} currentUserId={currentUserId}/>
                  ))}
                </div>
              )}
            </>
          )
        ) : (
          /* Trending — shown when no search */
          <div>
            <h2 className="text-x-light font-bold text-xl px-4 py-4">Trends for you</h2>
            {TRENDS.map((trend, i) => (
              <div key={trend.tag}
                className="px-4 py-3 hover:bg-x-surface/50 transition-colors cursor-pointer border-b border-x-border"
                onClick={() => handleSearch(trend.tag)}>
                <p className="text-x-gray text-xs">{trend.category} · Trending</p>
                <p className="text-x-light font-bold">{trend.tag}</p>
                <p className="text-x-gray text-xs">{trend.posts} posts</p>
              </div>
            ))}
          </div>
        )}

      </main>
      <MobileNav active="explore"/>
    </div>
  )
}
