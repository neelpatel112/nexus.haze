'use client'

export default function MobileNav({ active }: { active?: string }) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50
                    bg-x-black border-t border-x-border
                    flex items-center justify-around py-2">
      {[
        { href: '/', label: 'home', icon: (
          <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
            <path d="M21.591 7.146L12.52 1.157c-.316-.21-.724-.21-1.04 0l-9.071 5.99c-.26.173-.409.456-.409.757v13.06c0 .502.418.92.92.92H8.28c.502 0 .92-.418.92-.92v-5.7h5.6v5.7c0 .502.418.92.92.92h5.38c.502 0 .92-.418.92-.92V7.903c0-.301-.158-.584-.408-.757z"/>
          </svg>
        )},
        { href: '/explore', label: 'explore', icon: (
          <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
            <path d="M10.25 3.75c-3.59 0-6.5 2.91-6.5 6.5s2.91 6.5 6.5 6.5c1.795 0 3.419-.726 4.596-1.904 1.178-1.177 1.904-2.801 1.904-4.596 0-3.59-2.91-6.5-6.5-6.5zm-8.5 6.5c0-4.694 3.806-8.5 8.5-8.5s8.5 3.806 8.5 8.5c0 1.986-.682 3.815-1.814 5.262l4.276 4.276-1.414 1.414-4.276-4.276C13.815 19.318 11.986 20 10.25 20c-4.694 0-8.5-3.806-8.5-8.5z"/>
          </svg>
        )},
        { href: '/compose', label: 'compose', icon: (
          <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
            <path d="M23 3c-6.62-.1-10.38 2.421-13.05 6.03C7.29 12.61 6 17.331 6 22h2c0-1.007.07-2.012.19-3H12c4.1 0 7.48-3.082 7.48-6.8 0-1.106-.309-2.027-.86-2.868-.ints 0 0-.98-1.775-2.06-2.332C18.698 6.45 19 5.736 19 5c0-1.12-.9-2-2-2-.586 0-1.115.24-1.498.625C14.184 3.25 12.5 3 12 3H8c-1.657 0-3 1.343-3 3v1H3c-1.1 0-2 .9-2 2v1c0 1.1.9 2 2 2h2v-1c0-.552.448-1 1-1h1v-1c0-.552.448-1 1-1h3c.5 0 1.89.246 3.195.59z"/>
          </svg>
        )},
        { href: '/messages', label: 'messages', icon: (
          <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
            <path d="M1.998 5.5c0-1.381 1.119-2.5 2.5-2.5h15c1.381 0 2.5 1.119 2.5 2.5v13c0 1.381-1.119 2.5-2.5 2.5h-15c-1.381 0-2.5-1.119-2.5-2.5v-13zm2.5-.5c-.276 0-.5.224-.5.5v2.764l8 3.638 8-3.638V5.5c0-.276-.224-.5-.5-.5h-15zm15.5 5.463l-7.5 3.413-7.5-3.413V18.5c0 .276.224.5.5.5h14c0 0 .5 0 .5-.5v-8.037z"/>
          </svg>
        )},
        { href: '/profile/me', label: 'profile', icon: (
          <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
            <path d="M5.651 19h12.698c-.337-1.8-1.023-3.21-1.945-4.19C15.318 13.65 13.838 13 12 13s-3.317.65-4.404 1.81c-.922.98-1.608 2.39-1.945 4.19zm.486-5.56C7.627 11.85 9.648 11 12 11s4.373.85 5.863 2.44c1.477 1.58 2.366 3.8 2.632 6.46l.11 1.1H3.395l.11-1.1c.266-2.66 1.155-4.88 2.632-6.46zM12 4c-1.105 0-2 .9-2 2s.895 2 2 2 2-.9 2-2-.895-2-2-2zM8 6c0-2.21 1.791-4 4-4s4 1.79 4 4-1.791 4-4 4-4-1.79-4-4z"/>
          </svg>
        )},
      ].map(item => (
        <a key={item.href} href={item.href}
          className={`p-3 rounded-full transition-colors
            ${active === item.label ? 'text-x-light' : 'text-x-gray hover:text-x-light'}`}
        >
          {item.icon}
        </a>
      ))}
    </nav>
  )
}
