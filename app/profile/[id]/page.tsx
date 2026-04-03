'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import MobileNav from '@/components/MobileNav'
import TweetCard from '@/components/TweetCard'
import type { Tweet, Profile } from '@/types'

export default function ProfilePage({ params }: { params: { id: string } }) {
  const [profile, setProfile]       = useState<Profile | null>(null)
  const [currentUser, setCurrentUser] = useState<Profile | null>(null)
  const [tweets, setTweets]         = useState<Tweet[]>([])
  const [likedTweets, setLikedTweets] = useState<Tweet[]>([])
  const [tab, setTab]               = useState<'tweets' | 'likes'>('tweets')
  const [isFollowing, setIsFollowing] = useState(false)
  const [loading, setLoading]       = useState(true)
  const [followLoading, setFollowLoading] = useState(false)
  const [isMe, setIsMe]             = useState(false)
  const [editing, setEditing]       = useState(false)
  const [editName, setEditName]     = useState('')
  const [editBio, setEditBio]       = useState('')
  const [editLocation, setEditLocation] = useState('')
  const [editWebsite, setEditWebsite] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [saving, setSaving]         = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { window.location.replace('/auth'); return }
      const uid = session.user.id
      const targetId = params.id === 'me' ? uid : params.id
      supabase.from('profiles').select('*').eq('id', uid).single()
        .then(({ data }) => { if (data) setCurrentUser(data) })
      loadProfile(targetId, uid)
    })
  }, [params.id])

  async function loadProfile(targetId: string, uid: string) {
    setLoading(true)
    const [{ data: p }, { data: t }, { data: f }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', targetId).single(),
      supabase.from('tweets').select('*, profiles(*)').eq('user_id', targetId).order('created_at', { ascending: false }),
      supabase.from('follows').select('id').eq('follower_id', uid).eq('following_id', targetId).single(),
    ])
    if (p) {
      setProfile(p)
      setEditName(p.display_name || '')
      setEditBio(p.bio || '')
      setEditLocation(p.location || '')
      setEditWebsite(p.website || '')
    }
    setTweets(t || [])
    setIsFollowing(!!f)
    setIsMe(targetId === uid)
    setLoading(false)

    // Load liked tweets
    const { data: likes } = await supabase
      .from('likes').select('tweet_id').eq('user_id', targetId)
    if (likes?.length) {
      const ids = likes.map(l => l.tweet_id)
      const { data: lt } = await supabase
        .from('tweets').select('*, profiles(*)').in('id', ids).order('created_at', { ascending: false })
      setLikedTweets(lt || [])
    }
  }

  async function toggleFollow() {
    if (!currentUser || !profile) return
    setFollowLoading(true)
    const newFollowing = !isFollowing
    setIsFollowing(newFollowing)
    setProfile(p => p ? { ...p, followers_count: p.followers_count + (newFollowing ? 1 : -1) } : p)

    if (newFollowing) {
      await supabase.from('follows').insert({ follower_id: currentUser.id, following_id: profile.id })
      await supabase.rpc('increment_followers', { target_id: profile.id })
      await supabase.rpc('increment_following', { target_id: currentUser.id })
    } else {
      await supabase.from('follows').delete().eq('follower_id', currentUser.id).eq('following_id', profile.id)
      await supabase.rpc('decrement_followers', { target_id: profile.id })
      await supabase.rpc('decrement_following', { target_id: currentUser.id })
    }
    setFollowLoading(false)
  }

  async function saveProfile() {
    if (!currentUser) return
    setSaving(true)
    let avatarUrl = profile?.avatar_url
    let bannerUrl = profile?.banner_url

    if (avatarFile) {
      const ext = avatarFile.name.split('.').pop()
      const path = `avatars/${currentUser.id}.${ext}`
      await supabase.storage.from('tweets').upload(path, avatarFile, { upsert: true })
      const { data } = supabase.storage.from('tweets').getPublicUrl(path)
      avatarUrl = data.publicUrl
    }
    if (bannerFile) {
      const ext = bannerFile.name.split('.').pop()
      const path = `banners/${currentUser.id}.${ext}`
      await supabase.storage.from('tweets').upload(path, bannerFile, { upsert: true })
      const { data } = supabase.storage.from('tweets').getPublicUrl(path)
      bannerUrl = data.publicUrl
    }

    await supabase.from('profiles').update({
      display_name: editName, bio: editBio,
      location: editLocation, website: editWebsite,
      avatar_url: avatarUrl, banner_url: bannerUrl
    }).eq('id', currentUser.id)

    setProfile(p => p ? { ...p, display_name: editName, bio: editBio, location: editLocation, website: editWebsite, avatar_url: avatarUrl || null, banner_url: bannerUrl || null } : p)
    setEditing(false)
    setSaving(false)
  }

  const letter = (profile?.username || 'U')[0].toUpperCase()
  const joinDate = profile ? new Date(profile.created_at).toLocaleDateString([], { month: 'long', year: 'numeric' }) : ''

  return (
    <div className="flex min-h-screen bg-x-black">
      <Sidebar active="profile"/>
      <main className="flex-1 border-x border-x-border max-w-[600px] min-h-screen pb-16 md:pb-0">

        {/* Header */}
        <div className="sticky top-0 z-10 bg-x-black/80 backdrop-blur-md border-b border-x-border px-4 py-3 flex items-center gap-4">
          <button onClick={() => history.back()} className="p-2 rounded-full hover:bg-x-surface transition-colors text-x-light">
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M7.414 13l5.043 5.04-1.414 1.42L3.586 12l7.457-7.46 1.414 1.42L7.414 11H21v2H7.414z"/></svg>
          </button>
          <div>
            <h2 className="text-x-light font-bold text-lg leading-tight">{profile?.display_name || profile?.username || '…'}</h2>
            <p className="text-x-gray text-xs">{profile?.tweets_count || 0} posts</p>
          </div>
        </div>

        {loading ? (
          <div className="animate-pulse">
            <div className="h-32 bg-x-surface"/>
            <div className="px-4 pb-4">
              <div className="w-20 h-20 rounded-full bg-x-border -mt-10 mb-3"/>
              <div className="h-4 bg-x-surface rounded w-1/3 mb-2"/>
              <div className="h-3 bg-x-surface rounded w-1/4 mb-4"/>
              <div className="h-3 bg-x-surface rounded w-2/3"/>
            </div>
          </div>
        ) : profile ? (
          <>
            {/* Banner */}
            <div className="relative">
              <div className="h-36 bg-gradient-to-br from-x-blue/30 to-purple-900/30 overflow-hidden">
                {profile.banner_url
                  ? <img src={profile.banner_url} className="w-full h-full object-cover" alt="banner"/>
                  : <div className="w-full h-full bg-gradient-to-br from-x-blue/20 to-purple-800/20"/>}
                {isMe && (
                  <label className="absolute inset-0 flex items-center justify-center cursor-pointer
                                    bg-black/30 opacity-0 hover:opacity-100 transition-opacity">
                    <svg viewBox="0 0 24 24" className="w-8 h-8 fill-white"><path d="M9.697 3H11v2h-.697l-3 6H3v10h18V11h-4.303l-3-6H13V3H9.697zM8.303 3H9v0zM21 9h1a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V10a1 1 0 0 1 1-1h1l4-8h10l4 8zM12 18a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm0-2a2 2 0 1 1 0-4 2 2 0 0 1 0 4z"/></svg>
                    <input type="file" accept="image/*" className="hidden" onChange={e => { setBannerFile(e.target.files?.[0] || null); setEditing(true) }}/>
                  </label>
                )}
              </div>

              {/* Avatar */}
              <div className="absolute -bottom-10 left-4">
                <div className="w-20 h-20 rounded-full border-4 border-x-black
                                bg-gradient-to-br from-x-blue to-purple-500
                                flex items-center justify-center text-white font-bold text-2xl overflow-hidden relative">
                  {profile.avatar_url
                    ? <img src={profile.avatar_url} className="w-full h-full object-cover" alt="avatar"/>
                    : letter}
                  {isMe && (
                    <label className="absolute inset-0 flex items-center justify-center cursor-pointer
                                      bg-black/40 opacity-0 hover:opacity-100 transition-opacity rounded-full">
                      <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white"><path d="M9.697 3H11v2h-.697l-3 6H3v10h18V11h-4.303l-3-6H13V3H9.697z"/></svg>
                      <input type="file" accept="image/*" className="hidden" onChange={e => { setAvatarFile(e.target.files?.[0] || null); setEditing(true) }}/>
                    </label>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end px-4 pt-3 pb-12 gap-2">
              {isMe ? (
                <button onClick={() => setEditing(true)}
                  className="btn-outline text-sm px-4 py-1.5">Edit profile</button>
              ) : (
                <>
                  <button className="p-2 rounded-full border border-x-border text-x-light hover:bg-x-surface transition-colors"
                    onClick={() => window.location.href = `/messages?dm=${profile.id}`}>
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M1.998 5.5c0-1.381 1.119-2.5 2.5-2.5h15c1.381 0 2.5 1.119 2.5 2.5v13c0 1.381-1.119 2.5-2.5 2.5h-15c-1.381 0-2.5-1.119-2.5-2.5v-13zm2.5-.5c-.276 0-.5.224-.5.5v2.764l8 3.638 8-3.638V5.5c0-.276-.224-.5-.5-.5h-15zm15.5 5.463l-7.5 3.413-7.5-3.413V18.5c0 .276.224.5.5.5h14c0 0 .5 0 .5-.5v-8.037z"/></svg>
                  </button>
                  <button onClick={toggleFollow} disabled={followLoading}
                    className={`font-bold rounded-full px-5 py-1.5 text-sm transition-colors disabled:opacity-50
                      ${isFollowing
                        ? 'border border-x-border text-x-light hover:border-red-500 hover:text-red-500 hover:bg-red-500/10'
                        : 'bg-x-light text-x-black hover:bg-x-light/90'}`}>
                    {isFollowing ? 'Following' : 'Follow'}
                  </button>
                </>
              )}
            </div>

            {/* Bio section */}
            <div className="px-4 pb-4 border-b border-x-border">
              <h2 className="text-x-light font-bold text-xl">{profile.display_name || profile.username}</h2>
              <p className="text-x-gray text-sm mb-2">@{profile.username}</p>
              {profile.bio && <p className="text-x-light text-sm leading-relaxed mb-3">{profile.bio}</p>}
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-x-gray text-sm mb-3">
                {profile.location && (
                  <span className="flex items-center gap-1">
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                    {profile.location}
                  </span>
                )}
                {profile.website && (
                  <a href={profile.website} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-x-blue hover:underline">
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M11.96 2.11C6.44 2.11 2 6.56 2 12.07c0 5.52 4.44 9.96 9.96 9.96s9.96-4.44 9.96-9.96c0-5.51-4.44-9.96-9.96-9.96zm7.28 6.27h-2.9c-.32-1.25-.77-2.43-1.35-3.5 1.69.61 3.1 1.82 4.25 3.5zm-7.28-4.13c.8 1.1 1.42 2.34 1.83 3.68H9.37c.41-1.34 1.03-2.58 1.83-3.68.24-.02.49-.04.74-.04s.5.02.74.04zM4.26 14.22c-.13-.43-.2-.88-.2-1.35s.07-.92.2-1.35h3.33c-.08.44-.13.89-.13 1.35s.05.91.13 1.35H4.26zm.46 1.58h2.9c.32 1.25.77 2.43 1.35 3.5-1.69-.61-3.1-1.82-4.25-3.5zm2.9-7.42H4.72c1.15-1.68 2.56-2.89 4.25-3.5-.58 1.07-1.03 2.25-1.35 3.5zm5.14 11.55c-.8-1.1-1.42-2.34-1.83-3.68h3.66c-.41 1.34-1.03 2.58-1.83 3.68-.24.02-.49.04-.74.04s-.5-.02-.74-.04zm2.04-.55c.58-1.07 1.03-2.25 1.35-3.5h2.9c-1.15 1.68-2.56 2.89-4.25 3.5zm1.58-5.08c.08-.44.13-.89.13-1.35s-.05-.91-.13-1.35h3.33c.13.43.2.88.2 1.35s-.07.92-.2 1.35h-3.33z"/></svg>
                    {profile.website.replace(/^https?:\/\//, '')}
                  </a>
                )}
                <span className="flex items-center gap-1">
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M7 4V3h2v1h6V3h2v1h1a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h3zm0 2H4v3h16V6h-3V5h-2v1H9V5H7v1zm-3 5v9h16v-9H4zm2 2h2v2H6v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2z"/></svg>
                  Joined {joinDate}
                </span>
              </div>
              <div className="flex gap-4 text-sm">
                <button className="hover:underline">
                  <strong className="text-x-light">{profile.following_count || 0}</strong>
                  <span className="text-x-gray"> Following</span>
                </button>
                <button className="hover:underline">
                  <strong className="text-x-light">{profile.followers_count || 0}</strong>
                  <span className="text-x-gray"> Followers</span>
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-x-border">
              {(['tweets', 'likes'] as const).map(t => (
                <button key={t}
                  className={`flex-1 py-4 text-sm font-semibold capitalize transition-colors
                    ${tab === t ? 'text-x-light border-b-2 border-x-blue' : 'text-x-gray hover:text-x-light hover:bg-white/5'}`}
                  onClick={() => setTab(t)}>
                  {t}
                </button>
              ))}
            </div>

            {/* Tweets / Likes */}
            {(tab === 'tweets' ? tweets : likedTweets).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-x-gray gap-2">
                <p className="text-x-light font-bold text-xl">
                  {tab === 'tweets' ? 'No posts yet' : 'No likes yet'}
                </p>
                <p className="text-sm text-center px-8">
                  {tab === 'tweets'
                    ? `When ${isMe ? 'you post' : profile.username + ' posts'}, it'll show up here.`
                    : `${isMe ? "You haven't" : profile.username + " hasn't"} liked any posts yet.`}
                </p>
              </div>
            ) : (
              (tab === 'tweets' ? tweets : likedTweets).map(t => (
                <TweetCard key={t.id} tweet={t} currentUserId={currentUser?.id}/>
              ))
            )}
          </>
        ) : (
          <div className="flex items-center justify-center py-24 text-x-gray">
            <p>User not found.</p>
          </div>
        )}
      </main>

      {/* Edit Profile Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-x-black border border-x-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-x-border">
              <div className="flex items-center gap-4">
                <button onClick={() => setEditing(false)} className="p-1 rounded-full hover:bg-x-surface text-x-light">✕</button>
                <h3 className="text-x-light font-bold text-lg">Edit profile</h3>
              </div>
              <button onClick={saveProfile} disabled={saving} className="btn-primary px-4 py-1.5 text-sm">
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
            <div className="p-4 flex flex-col gap-4">
              {[
                { label: 'Name', value: editName, setter: setEditName, placeholder: 'Your name' },
                { label: 'Bio', value: editBio, setter: setEditBio, placeholder: 'Tell the world about yourself' },
                { label: 'Location', value: editLocation, setter: setEditLocation, placeholder: 'Where are you?' },
                { label: 'Website', value: editWebsite, setter: setEditWebsite, placeholder: 'https://yoursite.com' },
              ].map(field => (
                <div key={field.label} className="border border-x-border rounded-md px-3 py-2 focus-within:border-x-blue transition-colors">
                  <label className="text-x-blue text-xs font-medium">{field.label}</label>
                  <input
                    className="w-full bg-transparent text-x-light text-sm outline-none mt-1"
                    value={field.value}
                    onChange={e => field.setter(e.target.value)}
                    placeholder={field.placeholder}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <MobileNav active="profile"/>
    </div>
  )
}
 