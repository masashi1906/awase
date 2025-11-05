'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CandidateDateForm } from './CandidateDateForm'
import { EventCreationSuccessDialog } from './EventCreationSuccessDialog'
import { useEventStore } from '@/lib/store/eventStore'
import { formatDateWithDay } from '@/lib/utils/dateUtils'
import { X, Loader2 } from 'lucide-react'
import type { CandidateDateInput, CreateEventResponse } from '@/types'

/**
 * イベント作成フォーム
 * タイトル、説明、候補日を入力してイベントを作成する
 */
export function EventForm() {
  const {
    title,
    description,
    candidateDates,
    setTitle,
    setDescription,
    addCandidateDate,
    removeCandidateDate,
    clearForm,
  } = useEventStore()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [creationResult, setCreationResult] = useState<CreateEventResponse | null>(
    null
  )

  const handleAddDate = (date: CandidateDateInput) => {
    addCandidateDate(date)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // バリデーション
    if (!title.trim()) {
      setError('タイトルを入力してください')
      return
    }

    if (candidateDates.length === 0) {
      setError('候補日を1つ以上追加してください')
      return
    }

    setIsSubmitting(true)

    try {
      // APIリクエスト
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          candidateDates,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'イベントの作成に失敗しました')
      }

      const data: CreateEventResponse = await response.json()

      // ストアをクリア
      clearForm()

      // 成功ダイアログを表示
      setCreationResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* タイトル・説明 */}
      <Card>
        <CardHeader>
          <CardTitle>イベント情報</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="title" className="text-sm font-medium">
              タイトル <span className="text-destructive">*</span>
            </label>
            <Input
              id="title"
              type="text"
              placeholder="例: チーム会議の日程調整"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="description" className="text-sm font-medium">
              説明（任意）
            </label>
            <Input
              id="description"
              type="text"
              placeholder="例: 来月のプロジェクト会議"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* 候補日追加 */}
      <div className="flex flex-col gap-4">
        <h3 className="text-lg font-semibold">
          候補日の追加 <span className="text-destructive">*</span>
        </h3>
        <CandidateDateForm onAdd={handleAddDate} />
      </div>

      {/* 候補日リスト */}
      {candidateDates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>追加済み候補日（{candidateDates.length}件）</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-2">
              {candidateDates.map((date, index) => (
                <li
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent transition-colors"
                >
                  <div className="flex flex-col gap-1">
                    <span className="font-medium">
                      {formatDateWithDay(date.date)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {date.start_time} 〜 {date.end_time}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCandidateDate(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* エラーメッセージ */}
      {error && (
        <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* 送信ボタン */}
      <Button
        type="submit"
        size="lg"
        disabled={isSubmitting}
        className="w-full"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            作成中...
          </>
        ) : (
          'イベントを作成'
        )}
      </Button>
    </form>

      {/* 成功ダイアログ */}
      {creationResult && (
        <EventCreationSuccessDialog
          open={!!creationResult}
          slug={creationResult.slug}
          eventEditCode={creationResult.event_edit_code}
        />
      )}
    </>
  )
}
