"use client";

import { cn } from '@/lib/utils'
import type { ChatMessage } from '@/hooks/use-realtime-chat'
import { useState } from 'react'
import Image from 'next/image'
import { ImageGalleryDialog } from '@/components/chat/image-gallery-dialog'

interface ChatMessageItemProps {
  message: ChatMessage
  isOwnMessage: boolean
  showHeader: boolean
}

export const ChatMessageItem = ({ message, isOwnMessage, showHeader }: ChatMessageItemProps) => {
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [galleryStartIndex, setGalleryStartIndex] = useState(0)

  const handleImageClick = (index: number = 0) => {
    setGalleryStartIndex(index)
    setGalleryOpen(true)
  }

  const hasImages = message.images && message.images.length > 0
  const hasContent = message.content && message.content.trim().length > 0

  return (
    <>
      <div className={`flex mt-2 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
        <div
          className={cn('max-w-[75%] w-fit flex flex-col gap-1', {
            'items-end': isOwnMessage,
          })}
        >
          {showHeader && (
            <div
              className={cn('flex items-center gap-2 text-xs px-3', {
                'justify-end flex-row-reverse': isOwnMessage,
              })}
            >
              <span className={'font-medium'}>{message.user.name}</span>
              <span className="text-foreground/50 text-xs">
                {new Date(message.createdAt).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true,
                })}
              </span>
            </div>
          )}
          
          {/* Text content */}
          {hasContent && (
            <div
              className={cn(
                'py-2 px-3 rounded-xl text-sm w-fit',
                isOwnMessage ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground',
                hasImages && 'mb-1'
              )}
            >
              {message.content}
            </div>
          )}

          {/* Images */}
          {hasImages && (
            <div className="flex flex-col gap-1">
              {message.images!.length === 1 ? (
                // Single image
                <button
                  onClick={() => handleImageClick(0)}
                  className="relative w-fit max-w-xs rounded-xl overflow-hidden hover:opacity-90 transition-opacity"
                >
                  <Image
                    src={message.images![0].url}
                    alt="Chat image"
                    width={300}
                    height={200}
                    className="object-cover rounded-xl"
                    sizes="(max-width: 768px) 300px, 300px"
                  />
                </button>
              ) : (
                // Multiple images - show first with "+X more" indicator
                <button
                  onClick={() => handleImageClick(0)}
                  className="relative w-fit max-w-xs rounded-xl overflow-hidden hover:opacity-90 transition-opacity"
                >
                  <Image
                    src={message.images![0].url}
                    alt={`Chat image 1 of ${message.images!.length}`}
                    width={300}
                    height={200}
                    className="object-cover rounded-xl"
                    sizes="(max-width: 768px) 300px, 300px"
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center rounded-xl">
                    <span className="text-white font-medium text-sm">
                      +{message.images!.length - 1} flere
                    </span>
                  </div>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Image Gallery Dialog */}
      {hasImages && (
        <ImageGalleryDialog
          images={message.images!}
          initialIndex={galleryStartIndex}
          open={galleryOpen}
          onOpenChange={setGalleryOpen}
        />
      )}
    </>
  )
}
