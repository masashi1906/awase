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

interface ResponseSuccessDialogProps {
  open: boolean
  eventSlug: string
  editCode: string
}

/**
 * 回答送信成功ダイアログ
 * 編集コード（4桁）を表示する
 */
export function ResponseSuccessDialog({
  open,
  eventSlug,
  editCode,
}: ResponseSuccessDialogProps) {
  const router = useRouter()
  const [codeCopied, setCodeCopied] = useState(false)

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(editCode)
      setCodeCopied(true)
      setTimeout(() => setCodeCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy code:', err)
    }
  }

  const handleNavigate = () => {
    router.push(`/event/${eventSlug}`)
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent showCloseButton={false} className="max-w-md">
        {/* ヘッダー */}
        <DialogHeader className="flex flex-col items-center gap-4">
          <CheckCircle2 className="w-16 h-16 text-green-600" />
          <DialogTitle className="text-xl">回答を送信しました</DialogTitle>
          <DialogDescription className="text-center">
            回答を編集する際に必要なコードです
          </DialogDescription>
        </DialogHeader>

        {/* コンテンツ */}
        <div className="space-y-6 py-4">
          {/* 編集コード */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">
              編集コード（8桁）
            </label>
            <div className="flex gap-2">
              <div className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-center">
                <code className="text-3xl font-mono font-bold text-gray-900 tracking-widest">
                  {editCode}
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
              <li>• 回答を編集する際に必要です</li>
              <li>• スクリーンショットを保存するか、メモしてください</li>
            </ul>
          </div>
        </div>

        {/* アクション */}
        <div className="flex flex-col gap-2">
          <Button
            onClick={handleCopyCode}
            variant="outline"
            className="w-full"
          >
            {codeCopied ? 'コピーしました！' : 'コードをコピー'}
          </Button>
          <Button
            onClick={handleNavigate}
            className="w-full bg-red-500 hover:bg-red-600"
          >
            イベント詳細へ戻る
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
