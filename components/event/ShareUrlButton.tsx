'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Share2, Check } from 'lucide-react'

interface ShareUrlButtonProps {
  url: string
}

/**
 * 共有URLコピーボタン（Client Component）
 * クリップボードへのコピー機能を提供
 */
export function ShareUrlButton({ url }: ShareUrlButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)

      // 2秒後に元に戻す
      setTimeout(() => {
        setCopied(false)
      }, 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleCopy}
      disabled={copied}
    >
      {copied ? (
        <>
          <Check className="h-4 w-4 mr-2" />
          コピー済み
        </>
      ) : (
        <>
          <Share2 className="h-4 w-4 mr-2" />
          コピー
        </>
      )}
    </Button>
  )
}
