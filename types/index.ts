export interface Profile {
  id: string
  username: string
  display_name: string | null
  bio: string | null
  avatar_url: string | null
  banner_url: string | null
  website: string | null
  location: string | null
  followers_count: number
  following_count: number
  tweets_count: number
  verified: boolean
  created_at: string
}

export interface Tweet {
  id: string
  user_id: string
  content: string
  image_url: string | null
  likes_count: number
  retweets_count: number
  replies_count: number
  views_count: number
  reply_to: string | null
  created_at: string
  profiles?: Profile
}

export interface Like {
  id: string
  user_id: string
  tweet_id: string
  created_at: string
}

export interface Retweet {
  id: string
  user_id: string
  tweet_id: string
  created_at: string
}

export interface Follow {
  id: string
  follower_id: string
  following_id: string
  created_at: string
}

export interface Message {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  seen: boolean
  created_at: string
  sender?: Profile
  receiver?: Profile
}
