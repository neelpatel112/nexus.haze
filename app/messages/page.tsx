'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import MobileNav from '@/components/MobileNav'
import type { Profile, Message } from '@/types'
import { formatDistanceToNowStrict } from 'date-fns'

export default function MessagesPage() {
  const [currentUser, setCurrentUser]   = useState<Profile | null>(null)
  const [threads, setThreads]           = useState<{ partner: Profile; lastMsg: Message }[]>([])
  const [activePartner, setActivePartner] = useState<Profile | null>(null)
  const [messages, setMessages]         = useState<Message[]>([])
  const [input, setInput]               = useState('')
  const [sending, setSending]           = useState(false)
  const [searching, setSearching]       = useState(false)
  const [searchQuery, setSearchQuery]   = useState('')
  const [searchResults, setSearchResults] = useState<Profile[]>([])
  const [newMsg, setNewMsg]             = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { window.location.replace('/auth'); return }
      supabase.from('profiles').select('*').eq('id', session.user.id).single()
        .then(({ data }) => { if (data) setCurrentUser(data) })
      loadThreads(session.user.id)

      // Check if coming from profile DM button
      const params = new URLSearchParams(window.location.search)
      const dmId = params.get('dm')
      if (dmId) {
        supabase.from('profiles').select('*').eq('id', dmId).single()
          .then(({ data }) => { if (data) openChat(data) })
      }
    })
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function loadThreads(uid: string) {
    const { data } = await supabase
      .from('messages')
      .select('*, sender:profiles!messages_sender_id_fkey(*), receiver:profiles!messages_receiver_id_fkey(*)')
      .or(`sender_id.eq.${uid},receiver_id.eq.${uid}`)
      .order('created_at', { ascending: false })

    if (!data) return
    const seen = new Set<string>()
    const t: typeof threads = []
    data.forEach((msg: any) => {
      const partner = msg.sender_id === uid ? msg.receiver : msg.sender
      if (partner && !seen.has(partner.id)) {
        seen.add(partner.id)
        t.push({ partner, lastMsg: msg })
      }
    })
    setThreads(t)
  }

  async function openChat(partner: Profile) {
    setActivePartner(partner)
    setNewMsg(false)
    if (!currentUser) return

    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${partner.id}),and(sender_id.eq.${partner.id},receiver_id.eq.${currentUser.id})`)
      .order('created_at', { ascending: true })

    setMessages(data || [])

    // Realtime
    supabase.channel('dm-' + partner.id)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages',
        filter: `sender_id=eq.${partner.id}` },
        (payload) => {
          const m = payload.new as Message
          if (m.receiver_id === currentUser.id) {
            setMessages(prev => [...prev, m])
          }
        })
      .subscribe()
  }

  async function sendMessage() {
    if (!input.trim() || !currentUser || !activePartner) return
    setSending(true)
    const msg = {
      sender_id: currentUser.id,
      receiver_id: activePartner.id,
      content: input.trim(),
      seen: false,
    }
    const { data } = await supabase.from('messages').insert(msg).select().single()
    if (data) setMessages(prev => [...prev, data])
    setInput('')
    setSending(false)
    loadThreads(currentUser.id)
  }

  let searchTimeout: NodeJS.Timeout
  function handleSearch(val: string) {
    setSearchQuery(val)
    clearTimeout(searchTimeout)
    if (!val.trim()) { setSearchResults([]); return }
    searchTimeout = setTimeout(async () => {
      const { data } = await supabase
        .from('profiles').select('*')
        .ilike('username', `%${val.trim()}%`)
        .neq('id', currentUser?.id || '')
        .limit(8)
      setSearchResults(data || [])
    }, 300)
  }

  const letter = (currentUser?.username || 'U')[0].toUpperCase()

  return (
    <div className="flex min-h-screen bg-x-black">
      <Sidebar active="messages"/>

      {/* Threads list */}
      <div className={`border-r border-x-border flex flex-col
        ${activePartner ? 'hidden md:flex w-80 xl:w-96' : 'flex flex-1 md:flex-none md:w-80 xl:w-96'}`}>

        <div className="sticky top-0 bg-x-black border-b border-x-border px-4 py-4 flex items-center justify-between">
          <h2 className="text-x-light font-bold text-xl">Messages</h2>
          <button onClick={() => setNewMsg(true)}
            className="p-2 rounded-full hover:bg-x-surface transition-colors text-x-light">
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
              <path d="M2.504 21.866l.526-2.108C3.04 19.tribe 3 18.536 3 18c0-.837.224-2.179.67-2.931L11.5 2.18c.68-1.17 2.32-1.17 3 0l7.83 12.89c.448.753.67 2.09.67 2.93 0 .54-.04 1.04-.03 1.66l.526 2.108a.5.5 0 0 1-.968.242L22 20.04c-.316.882-.87 1.56-1.5 1.96H3.5c-.63-.4-1.184-1.078-1.5-1.96l-.528 1.968a.5.5 0 0 1-.968-.242zM12 5l-7 11.5h14L12 5z"/>
            </svg>
          </button>
        </div>

        {/* Search in threads */}
        <div className="px-4 py-2 border-b border-x-border">
          <div className="flex items-center gap-2 bg-x-surface rounded-full px-3 py-2">
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-x-gray fill-current flex-shrink-0">
              <path d="M10.25 3.75c-3.59 0-6.5 2.91-6.5 6.5s2.91 6.5 6.5 6.5c1.795 0 3.419-.726 4.596-1.904 1.178-1.177 1.904-2.801 1.904-4.596 0-3.59-2.91-6.5-6.5-6.5zm-8.5 6.5c0-4.694 3.806-8.5 8.5-8.5s8.5 3.806 8.5 8.5c0 1.986-.682 3.815-1.814 5.262l4.276 4.276-1.414 1.414-4.276-4.276C13.815 19.318 11.986 20 10.25 20c-4.694 0-8.5-3.806-8.5-8.5z"/>
            </svg>
            <input className="bg-transparent text-x-light text-sm placeholder:text-x-gray outline-none flex-1"
              placeholder="Search Direct Messages"/>
          </div>
        </div>

        {/* Thread list */}
        <div className="flex-1 overflow-y-auto">
          {threads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-8 gap-3 text-center">
              <p className="text-x-light font-bold text-xl">Welcome to your inbox!</p>
              <p className="text-x-gray text-sm">Drop a line, share posts and more with private conversations between you and others on X.</p>
              <button onClick={() => setNewMsg(true)} className="btn-primary mt-2">Write a message</button>
            </div>
          ) : threads.map(({ partner, lastMsg }) => {
            const l = (partner.username || 'U')[0].toUpperCase()
            const isMe = lastMsg.sender_id === currentUser?.id
            return (
              <div key={partner.id}
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-x-surface/50
                  ${activePartner?.id === partner.id ? 'bg-x-surface/30' : ''}`}
                onClick={() => openChat(partner)}>
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-x-blue to-purple-500
                                flex items-center justify-center text-white font-bold overflow-hidden flex-shrink-0">
                  {partner.avatar_url ? <img src={partner.avatar_url} className="w-full h-full object-cover" alt="avatar"/> : l}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-x-light font-bold text-sm truncate">{partner.display_name || partner.username}</p>
                    <span className="text-x-gray text-xs flex-shrink-0 ml-2">
                      {formatDistanceToNowStrict(new Date(lastMsg.created_at), { addSuffix: false })}
                    </span>
                  </div>
                  <p className="text-x-gray text-sm truncate">
                    {isMe ? 'You: ' : ''}{lastMsg.content}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Chat panel */}
      {activePartner ? (
        <div className="flex-1 flex flex-col border-r border-x-border max-w-[600px] h-screen">

          {/* Chat header */}
          <div className="sticky top-0 bg-x-black/90 backdrop-blur-md border-b border-x-border px-4 py-3 flex items-center gap-3">
            <button className="md:hidden p-2 rounded-full hover:bg-x-surface text-x-light"
              onClick={() => setActivePartner(null)}>
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M7.414 13l5.043 5.04-1.414 1.42L3.586 12l7.457-7.46 1.414 1.42L7.414 11H21v2H7.414z"/></svg>
            </button>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-x-blue to-purple-500
                            flex items-center justify-center text-white font-bold text-sm overflow-hidden cursor-pointer"
              onClick={() => window.location.href = `/profile/${activePartner.id}`}>
              {activePartner.avatar_url
                ? <img src={activePartner.avatar_url} className="w-full h-full object-cover" alt="avatar"/>
                : (activePartner.username || 'U')[0].toUpperCase()}
            </div>
            <div className="cursor-pointer" onClick={() => window.location.href = `/profile/${activePartner.id}`}>
              <p className="text-x-light font-bold text-sm">{activePartner.display_name || activePartner.username}</p>
              <p className="text-x-gray text-xs">@{activePartner.username}</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center flex-1 gap-3 text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-x-blue to-purple-500
                                flex items-center justify-center text-white font-bold text-2xl overflow-hidden">
                  {activePartner.avatar_url
                    ? <img src={activePartner.avatar_url} className="w-full h-full object-cover" alt="avatar"/>
                    : (activePartner.username || 'U')[0].toUpperCase()}
                </div>
                <p className="text-x-light font-bold text-xl">{activePartner.display_name || activePartner.username}</p>
                <p className="text-x-gray text-sm">@{activePartner.username}</p>
                <p className="text-x-gray text-sm">Start your conversation!</p>
              </div>
            )}
            {messages.map(msg => {
              const isMe = msg.sender_id === currentUser?.id
              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed
                    ${isMe
                      ? 'bg-x-blue text-white rounded-br-md'
                      : 'bg-x-surface text-x-light rounded-bl-md'}`}>
                    {msg.content}
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef}/>
          </div>

          {/* Input */}
          <div className="border-t border-x-border px-4 py-3 flex items-center gap-3">
            <div className="flex-1 flex items-center gap-3 bg-x-surface rounded-full px-4 py-2.5 border border-transparent focus-within:border-x-blue transition-colors">
              <input
                className="flex-1 bg-transparent text-x-light text-sm placeholder:text-x-gray outline-none"
                placeholder="Start a new message"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
              />
            </div>
            <button onClick={sendMessage} disabled={!input.trim() || sending}
              className="p-2.5 rounded-full bg-x-blue disabled:opacity-40 transition-opacity hover:bg-x-blue-hover">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
                <path d="M2.504 21.866l.526-2.108C3.04 19.tribe 3 18.536 3 18c0-.837.224-2.179.67-2.931L11.5 2.18c.68-1.17 2.32-1.17 3 0l7.83 12.89c.448.753.67 2.09.67 2.93 0 .54-.04 1.04-.03 1.66l.526 2.108a.5.5 0 0 1-.968.242L22 20.04c-.316.882-.87 1.56-1.5 1.96H3.5c-.63-.4-1.184-1.078-1.5-1.96l-.528 1.968a.5.5 0 0 1-.968-.242z"/>
              </svg>
            </button>
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center border-r border-x-border">
          <div className="text-center px-8">
            <p className="text-x-light font-bold text-2xl mb-2">Select a message</p>
            <p className="text-x-gray text-sm mb-6">Choose from your existing conversations, start a new one, or just keep swimming.</p>
            <button onClick={() => setNewMsg(true)} className="btn-primary">New message</button>
          </div>
        </div>
      )}

      {/* New message modal */}
      {newMsg && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center pt-16 px-4">
          <div className="bg-x-black border border-x-border rounded-2xl w-full max-w-sm">
            <div className="flex items-center justify-between px-4 py-3 border-b border-x-border">
              <button onClick={() => { setNewMsg(false); setSearchQuery(''); setSearchResults([]) }}
                className="text-x-light text-lg">✕</button>
              <h3 className="text-x-light font-bold">New message</h3>
              <div className="w-6"/>
            </div>
            <div className="px-4 py-2 border-b border-x-border">
              <input
                className="w-full bg-transparent text-x-light text-sm placeholder:text-x-gray outline-none py-2"
                placeholder="Search people"
                value={searchQuery}
                onChange={e => handleSearch(e.target.value)}
                autoFocus
              />
            </div>
            <div className="max-h-72 overflow-y-auto">
              {searchResults.map(user => {
                const l = (user.username || 'U')[0].toUpperCase()
                return (
                  <div key={user.id}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-x-surface/50 cursor-pointer transition-colors"
                    onClick={() => openChat(user)}>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-x-blue to-purple-500
                                    flex items-center justify-center text-white font-bold text-sm overflow-hidden flex-shrink-0">
                      {user.avatar_url ? <img src={user.avatar_url} className="w-full h-full object-cover" alt="avatar"/> : l}
                    </div>
                    <div>
                      <p className="text-x-light font-bold text-sm">{user.display_name || user.username}</p>
                      <p className="text-x-gray text-sm">@{user.username}</p>
                    </div>
                  </div>
                )
              })}
              {searchQuery && searchResults.length === 0 && (
                <p className="text-x-gray text-sm px-4 py-6 text-center">No users found.</p>
              )}
            </div>
          </div>
        </div>
      )}

      <MobileNav active="messages"/>
    </div>
  )
}
 