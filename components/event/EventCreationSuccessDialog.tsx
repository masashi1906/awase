'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Copy, Check } from 'lucide-react'

interface EventCreationSuccessDialogProps {
  open: boolean
  slug: string
  eventEditCode: string
}

/**
 * イベント作成成功ダイアログ
 * 共有URLとイベント編集コードを表示する
 */
export function EventCreationSuccessDialog({
  open,
  slug,
  eventEditCode,
}: EventCreationSuccessDialogProps) {
  const router = useRouter()
  const [urlCopied, setUrlCopied] = useState(false)
  const [codeCopied, setCodeCopied] = useState(false)

  const eventUrl = `${window.location.origin}/event/${slug}`

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(eventUrl)
      setUrlCopied(true)
      setTimeout(() => setUrlCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy URL:', err)
    }
  }

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(eventEditCode)
      setCodeCopied(true)
      setTimeout(() => setCodeCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy code:', err)
    }
  }

  const handleNavigate = () => {
    router.push(`/event/${slug}`)
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent showCloseButton={false} className="max-w-md">
        {/* ヘッダー */}
        <DialogHeader className="flex flex-col items-center gap-4">
          <CheckCircle2 className="w-16 h-16 text-green-600" />
          <DialogTitle className="text-xl">イベントを作成しました</DialogTitle>
          <DialogDescription className="text-center">
            以下の情報を参加者に共有してください
          </DialogDescription>
        </DialogHeader>

        {/* コンテンツ */}
        <div className="space-y-6 py-4">
          {/* 共有URL */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">共有URL</label>
            <div className="flex gap-2">
              <div className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md overflow-x-auto">
                <code className="text-sm font-mono text-gray-900 whitespace-nowrap">
                  {eventUrl}
                </code>
              </div>
              <Button
                onClick={handleCopyUrl}
                variant="outline"
                size="sm"
                className="flex-shrink-0"
              >
                {urlCopied ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* イベント編集コード */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">
              イベント編集コード
            </label>
            <div className="flex gap-2">
              <div className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-center">
                <code className="text-2xl font-mono font-bold text-gray-900 tracking-wider">
                  {eventEditCode}
                </code>
              </div>
              <Button
                onClick={handleCopyCode}
                variant="outline"
                size="sm"
                className="flex-shrink-0"
              >
                {codeCopied ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* 警告メッセージ */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-md space-y-2">
            <p className="text-sm font-semibold text-amber-900">⚠️ 重要</p>
            <ul className="text-sm text-amber-800 space-y-1">
              <li>• この編集コードは再表示できません</li>
              <li>• イベント情報を編集する際に必要です</li>
              <li>• スクリーンショットを保存するか、メモしてください</li>
            </ul>
          </div>
        </div>

        {/* アクション */}
        <div className="flex flex-col gap-2">
          <Button
            onClick={handleNavigate}
            className="w-full bg-red-500 hover:bg-red-600"
          >
            イベント詳細へ
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
