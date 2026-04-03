'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import MobileNav from '@/components/MobileNav'
import TweetCard from '@/components/TweetCard'
import type { Tweet, Profile } from '@/types'

export default function TweetPage({ params }: { params: { id: string } }) {
  const [tweet, setTweet]       = useState<Tweet | null>(null)
  const [replies, setReplies]   = useState<Tweet[]>([])
  const [profile, setProfile]   = useState<Profile | null>(null)
  const [reply, setReply]       = useState('')
  const [loading, setLoading]   = useState(true)
  const [posting, setPosting]   = useState(false)
  const [liked, setLiked]       = useState(false)
  const [retweeted, setRt]      = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { window.location.replace('/auth'); return }
      supabase.from('profiles').select('*').eq('id', session.user.id).single()
        .then(({ data }) => { if (data) setProfile(data) })
      loadTweet(session.user.id)
    })
  }, [params.id])

  async function loadTweet(uid: string) {
    setLoading(true)
    const [{ data: t }, { data: r }, { data: lk }, { data: rt }] = await Promise.all([
      supabase.from('tweets').select('*, profiles(*)').eq('id', params.id).single(),
      supabase.from('tweets').select('*, profiles(*)').eq('reply_to', params.id).order('created_at', { ascending: true }),
      supabase.from('likes').select('id').eq('tweet_id', params.id).eq('user_id', uid).single(),
      supabase.from('retweets').select('id').eq('tweet_id', params.id).eq('user_id', uid).single(),
    ])
    if (t) setTweet(t)
    setReplies(r || [])
    setLiked(!!lk)
    setRt(!!rt)
    setLoading(false)

    // Increment views
    if (t) await supabase.from('tweets').update({ views_count: (t.views_count || 0) + 1 }).eq('id', params.id)
  }

  async function postReply() {
    if (!reply.trim() || !profile || !tweet) return
    setPosting(true)
    const { data, error } = await supabase.from('tweets').insert({
      user_id: profile.id,
      content: reply.trim(),
      reply_to: tweet.id,
      likes_count: 0, retweets_count: 0, replies_count: 0, views_count: 0
    }).select('*, profiles(*)').single()

    if (!error && data) {
      setReplies(prev => [...prev, data])
      await supabase.from('tweets').update({ replies_count: (tweet.replies_count || 0) + 1 }).eq('id', tweet.id)
      setReply('')
    }
    setPosting(false)
  }

  const letter = (profile?.username || 'U')[0].toUpperCase()

  return (
    <div className="flex min-h-screen bg-x-black">
      <Sidebar active="home" />
      <main className="flex-1 border-x border-x-border max-w-[600px] min-h-screen pb-16 md:pb-0">

        {/* Header */}
        <div className="sticky top-0 z-10 bg-x-black/80 backdrop-blur-md border-b border-x-border px-4 py-3 flex items-center gap-6">
          <button onClick={() => history.back()}
            className="p-2 rounded-full hover:bg-x-surface transition-colors text-x-light">
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
              <path d="M7.414 13l5.043 5.04-1.414 1.42L3.586 12l7.457-7.46 1.414 1.42L7.414 11H21v2H7.414z"/>
            </svg>
          </button>
          <h2 className="text-x-light font-bold text-xl">Post</h2>
        </div>

        {loading ? (
          <div className="flex flex-col gap-4 p-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-x-surface flex-shrink-0"/>
                <div className="flex-1 space-y-2 pt-1">
                  <div className="h-3 bg-x-surface rounded w-1/3"/>
                  <div className="h-3 bg-x-surface rounded w-full"/>
                  <div className="h-3 bg-x-surface rounded w-2/3"/>
                </div>
              </div>
            ))}
          </div>
        ) : tweet ? (
          <>
            {/* Main tweet — expanded view */}
            <div className="px-4 pt-4 pb-2 border-b border-x-border">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-x-blue to-purple-500
                                flex items-center justify-center text-white font-bold text-sm overflow-hidden flex-shrink-0">
                  {tweet.profiles?.avatar_url
                    ? <img src={tweet.profiles.avatar_url} className="w-full h-full object-cover" alt="avatar"/>
                    : (tweet.profiles?.username || 'U')[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-x-light font-bold text-sm leading-tight">
                    {tweet.profiles?.display_name || tweet.profiles?.username}
                  </p>
                  <p className="text-x-gray text-sm">@{tweet.profiles?.username}</p>
                </div>
              </div>

              <p className="text-x-light text-xl leading-relaxed whitespace-pre-wrap break-words mb-3">
                {tweet.content}
              </p>

              {tweet.image_url && (
                <div className="rounded-2xl overflow-hidden border border-x-border mb-3">
                  <img src={tweet.image_url} className="w-full max-h-96 object-cover" alt="tweet"/>
                </div>
              )}

              <p className="text-x-gray text-sm mb-3">
                {new Date(tweet.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                {' · '}
                {new Date(tweet.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                {tweet.views_count ? ` · ${tweet.views_count.toLocaleString()} views` : ''}
              </p>

              {/* Stats row */}
              <div className="flex gap-4 py-3 border-y border-x-border text-sm">
                <span><strong className="text-x-light">{tweet.retweets_count || 0}</strong> <span className="text-x-gray">Reposts</span></span>
                <span><strong className="text-x-light">{tweet.likes_count || 0}</strong> <span className="text-x-gray">Likes</span></span>
              </div>

              {/* Action row */}
              <TweetCard tweet={tweet} currentUserId={profile?.id} initialLiked={liked} initialRetweeted={retweeted}/>
            </div>

            {/* Reply box */}
            <div className="flex gap-3 px-4 py-3 border-b border-x-border">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-x-blue to-purple-500
                              flex items-center justify-center text-white font-bold text-sm flex-shrink-0 overflow-hidden">
                {profile?.avatar_url
                  ? <img src={profile.avatar_url} className="w-full h-full object-cover" alt="avatar"/>
                  : letter}
              </div>
              <div className="flex-1">
                <textarea
                  className="w-full bg-transparent text-x-light text-base placeholder:text-x-gray
                             resize-none outline-none min-h-[60px] leading-relaxed"
                  placeholder="Post your reply"
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  maxLength={280}
                />
                <div className="flex justify-end">
                  <button
                    className="btn-primary disabled:opacity-40"
                    onClick={postReply}
                    disabled={!reply.trim() || posting}
                  >
                    {posting ? 'Posting…' : 'Reply'}
                  </button>
                </div>
              </div>
            </div>

            {/* Replies */}
            {replies.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-x-gray gap-2">
                <p className="text-x-light font-bold text-xl">No replies yet</p>
                <p className="text-sm">Be the first to reply.</p>
              </div>
            ) : (
              replies.map(r => (
                <TweetCard key={r.id} tweet={r} currentUserId={profile?.id}/>
              ))
            )}
          </>
        ) : (
          <div className="flex items-center justify-center py-24 text-x-gray">
            <p>Tweet not found.</p>
          </div>
        )}
      </main>
      <MobileNav active="home"/>
    </div>
  )
}
