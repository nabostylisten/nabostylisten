'use client'

import { createClient } from '@/lib/supabase/client'
import { useCallback, useEffect, useState } from 'react'

interface UseRealtimeChatProps {
  roomName: string
  username: string
  userId: string // Add userId to properly track message ownership
  onReadStatusChange?: (data: { chat_id: string; message_id: string; is_read: boolean }) => void
}

export interface ChatMessage {
  id: string
  content: string
  user: {
    name: string
    senderId: string // Sender ID for message ownership comparison
  }
  createdAt: string
  images?: Array<{
    id: string
    file_path: string
    url: string
  }>
}

const EVENT_MESSAGE_TYPE = 'message'

export function useRealtimeChat({ roomName, username, userId, onReadStatusChange }: UseRealtimeChatProps) {
  const supabase = createClient()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [channel, setChannel] = useState<ReturnType<typeof supabase.channel> | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const newChannel = supabase.channel(roomName)

    newChannel
      .on('broadcast', { event: EVENT_MESSAGE_TYPE }, (payload) => {
        setMessages((current) => [...current, payload.payload as ChatMessage])
      })
      .on('broadcast', { event: 'chat_message_read_status' }, (payload) => {
        if (onReadStatusChange && payload.payload) {
          onReadStatusChange(payload.payload)
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true)
        }
      })

    setChannel(newChannel)

    return () => {
      supabase.removeChannel(newChannel)
    }
  }, [roomName, username, userId, onReadStatusChange, supabase])

  const sendMessage = useCallback(
    async (content: string) => {
      if (!channel || !isConnected) return

      const message: ChatMessage = {
        id: crypto.randomUUID(),
        content,
        user: {
          name: username,
          senderId: userId,
        },
        createdAt: new Date().toISOString(),
      }

      // Update local state immediately for the sender
      setMessages((current) => [...current, message])

      await channel.send({
        type: 'broadcast',
        event: EVENT_MESSAGE_TYPE,
        payload: message,
      })
    },
    [channel, isConnected, username, userId]
  )

  return { messages, sendMessage, isConnected }
}
