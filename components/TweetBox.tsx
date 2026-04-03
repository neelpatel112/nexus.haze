'use client'

import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types'

interface Props { profile: Profile | null; onTweet?: () => void }

const MAX = 280

export default function TweetBox({ profile, onTweet }: Props) {
  const [content, setContent]   = useState('')
  const [imageFile, setImage]   = useState<File | null>(null)
  const [preview, setPreview]   = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const remaining = MAX - content.length
  const canPost   = content.trim().length > 0 && !loading
  const letter    = (profile?.username || 'U')[0].toUpperCase()

  function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImage(file)
    setPreview(URL.createObjectURL(file))
  }

  async function handlePost() {
    if (!canPost || !profile) return
    setLoading(true)

    let imageUrl: string | null = null

    if (imageFile) {
      const ext      = imageFile.name.split('.').pop()
      const fileName = `tweets/${profile.id}/${Date.now()}.${ext}`
      const { error: uploadErr } = await supabase.storage.from('tweets').upload(fileName, imageFile)
      if (!uploadErr) {
        const { data } = supabase.storage.from('tweets').getPublicUrl(fileName)
        imageUrl = data.publicUrl
      }
    }

    const { error } = await supabase.from('tweets').insert({
      user_id:        profile.id,
      content:        content.trim(),
      image_url:      imageUrl,
      likes_count:    0,
      retweets_count: 0,
      replies_count:  0,
      views_count:    0,
    })

    if (!error) {
      await supabase.from('profiles')
        .update({ tweets_count: (profile.tweets_count || 0) + 1 })
        .eq('id', profile.id)
      setContent('')
      setImage(null)
      setPreview(null)
      onTweet?.()
    }

    setLoading(false)
  }

  return (
    <div className="flex gap-3 px-4 py-3 border-b border-x-border">
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-x-blue to-purple-500
                      flex items-center justify-center text-white font-bold text-sm
                      flex-shrink-0 overflow-hidden">
        {profile?.avatar_url
          ? <img src={profile.avatar_url} className="w-full h-full object-cover" alt="avatar"/>
          : letter}
      </div>

      <div className="flex-1">
        <textarea
          className="w-full bg-transparent text-x-light text-lg placeholder:text-x-gray
                     resize-none outline-none min-h-[80px] leading-relaxed"
          placeholder="What is happening?!"
          value={content}
          onChange={e => setContent(e.target.value)}
          maxLength={MAX}
        />

        {/* Image preview */}
        {preview && (
          <div className="relative mt-2 rounded-2xl overflow-hidden border border-x-border">
            <img src={preview} className="w-full max-h-72 object-cover" alt="preview"/>
            <button
              onClick={() => { setImage(null); setPreview(null) }}
              className="absolute top-2 right-2 bg-black/70 text-white rounded-full w-7 h-7
                         flex items-center justify-center text-sm hover:bg-black"
            >✕</button>
          </div>
        )}

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-x-border">
          {/* Media buttons */}
          <div className="flex items-center gap-1 -ml-2">
            <button
              onClick={() => fileRef.current?.click()}
              className="p-2 rounded-full text-x-blue hover:bg-x-blue/10 transition-colors"
              title="Add image"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                <path d="M3 5.5C3 4.119 4.119 3 5.5 3h13C19.881 3 21 4.119 21 5.5v13c0 1.381-1.119 2.5-2.5 2.5h-13C4.119 21 3 19.881 3 18.5v-13zM5.5 5c-.276 0-.5.224-.5.5v9.086l3-3 3 3 5-5 3 3V5.5c0-.276-.224-.5-.5-.5h-13zM19 15.414l-3-3-5 5-3-3-3 3V18.5c0 .276.224.5.5.5h13c.276 0 .5-.224.5-.5v-3.086zM9.75 7C8.784 7 8 7.784 8 8.75s.784 1.75 1.75 1.75 1.75-.784 1.75-1.75S10.716 7 9.75 7z"/>
              </svg>
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage}/>

            <button className="p-2 rounded-full text-x-blue hover:bg-x-blue/10 transition-colors" title="GIF">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                <path d="M3 5.5C3 4.119 4.119 3 5.5 3h13C19.881 3 21 4.119 21 5.5v13c0 1.381-1.119 2.5-2.5 2.5h-13C4.119 21 3 19.881 3 18.5v-13zM5.5 5c-.276 0-.5.224-.5.5v13c0 .276.224.5.5.5h13c.276 0 .5-.224.5-.5v-13c0-.276-.224-.5-.5-.5h-13zM7 11h2v2H7v-2zm0-4h2v2H7V7zm4 0h2v2h-2V7zm0 4h2v2h-2v-2zm4-4h2v2h-2V7z"/>
              </svg>
            </button>

            <button className="p-2 rounded-full text-x-blue hover:bg-x-blue/10 transition-colors" title="Emoji">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                <path d="M12 22.75C6.072 22.75 1.25 17.928 1.25 12S6.072 1.25 12 1.25 22.75 6.072 22.75 12 17.928 22.75 12 22.75zm0-20C6.9 2.75 2.75 6.9 2.75 12S6.9 21.25 12 21.25s9.25-4.15 9.25-9.25S17.1 2.75 12 2.75zM9 11.5c-.69 0-1.25-.56-1.25-1.25S8.31 9 9 9s1.25.56 1.25 1.25S9.69 11.5 9 11.5zm6 0c-.69 0-1.25-.56-1.25-1.25S14.31 9 15 9s1.25.56 1.25 1.25S15.69 11.5 15 11.5zm-7.5 3h9c-.41 2.17-2.27 3.75-4.5 3.75S7.91 16.67 7.5 14.5z"/>
              </svg>
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* Character ring */}
            {content.length > 0 && (
              <div className="relative w-8 h-8 flex items-center justify-center">
                <svg viewBox="0 0 32 32" className="w-8 h-8 -rotate-90 absolute">
                  <circle cx="16" cy="16" r="12" fill="none" stroke="#2f3336" strokeWidth="2.5"/>
                  <circle cx="16" cy="16" r="12" fill="none"
                    stroke={remaining < 0 ? '#f4212e' : remaining < 20 ? '#ffd400' : '#1d9bf0'}
                    strokeWidth="2.5"
                    strokeDasharray={`${Math.PI * 24}`}
                    strokeDashoffset={`${Math.PI * 24 * (1 - Math.min(content.length, MAX) / MAX)}`}
                    strokeLinecap="round"
                  />
                </svg>
                {remaining <= 20 && (
                  <span className={`text-xs font-bold relative z-10 ${remaining < 0 ? 'text-red-500' : 'text-x-gray'}`}>
                    {remaining}
                  </span>
                )}
              </div>
            )}

            <button
              className="btn-primary disabled:opacity-40"
              onClick={handlePost}
              disabled={!canPost || remaining < 0}
            >
              {loading ? 'Posting…' : 'Post'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
