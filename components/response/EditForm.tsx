'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Calendar } from '@/components/calendar'
import { useResponseStore } from '@/lib/store/responseStore'
import type { CandidateDate, TimeSlot } from '@/types'

interface EditFormProps {
  eventSlug: string
  candidateDates: CandidateDate[]
}

/**
 * 回答編集フォーム
 * 名前＋編集コードで認証し、既存の回答を編集
 */
export function EditForm({ eventSlug, candidateDates }: EditFormProps) {
  const router = useRouter()
  const {
    participantName,
    selectedSlots,
    setParticipantName,
    getAvailabilityBlocks,
    loadFromResponse,
    reset,
  } = useResponseStore()

  const [editCode, setEditCode] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [responseId, setResponseId] = useState<string | null>(null)
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // TimeSlot[] → Map<date, Set<time>> 変換
  const selectedSlotsMap = useMemo(() => {
    const map = new Map<string, Set<string>>()
    selectedSlots.forEach((slot: TimeSlot) => {
      if (!map.has(slot.date)) {
        map.set(slot.date, new Set())
      }
      map.get(slot.date)!.add(slot.time)
    })
    return map
  }, [selectedSlots])

  const handleSelectionChange = (date: string, times: Set<string>) => {
    const otherSlots = selectedSlots.filter((slot) => slot.date !== date)
    const newSlots: TimeSlot[] = Array.from(times).map((time) => ({
      date,
      time,
    }))
    useResponseStore.setState({
      selectedSlots: [...otherSlots, ...newSlots],
    })
  }

  // 認証処理
  const handleAuthenticate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!participantName.trim()) {
      setError('名前を入力してください')
      return
    }

    if (!editCode.trim()) {
      setError('編集コードを入力してください')
      return
    }

    setIsAuthenticating(true)

    try {
      const response = await fetch(
        `/api/events/${eventSlug}/responses?name=${encodeURIComponent(
          participantName.trim()
        )}&code=${encodeURIComponent(editCode.trim())}`
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || '認証に失敗しました')
      }

      const data = await response.json()

      // 既存の回答データをストアにロード
      setResponseId(data.id)
      loadFromResponse(data.availability_blocks)
      setIsAuthenticated(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : '認証に失敗しました')
      setIsAuthenticating(false)
    } finally {
      setIsAuthenticating(false)
    }
  }

  // 更新処理
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (selectedSlots.length === 0) {
      setError('少なくとも1つの時間帯を選択してください')
      return
    }

    setIsSubmitting(true)

    try {
      const blocks = getAvailabilityBlocks()

      const response = await fetch(`/api/events/${eventSlug}/responses`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          response_id: responseId,
          participant_name: participantName.trim(),
          edit_code: editCode.trim(),
          availability_blocks: blocks,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || '更新に失敗しました')
      }

      // ストアをリセット
      reset()

      // 成功したらイベント詳細ページに戻る
      router.push(`/event/${eventSlug}?updated=true`)
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新に失敗しました')
      setIsSubmitting(false)
    }
  }

  const totalSelectedSlots = selectedSlots.length

  // 認証前の画面
  if (!isAuthenticated) {
    return (
      <form onSubmit={handleAuthenticate} className="flex flex-col gap-6">
        <Card>
          <CardContent className="pt-6 flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="participantName" className="text-sm font-medium">
                名前 <span className="text-destructive">*</span>
              </label>
              <Input
                id="participantName"
                type="text"
                placeholder="山田太郎"
                value={participantName}
                onChange={(e) => setParticipantName(e.target.value)}
                disabled={isAuthenticating}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="editCode" className="text-sm font-medium">
                編集コード <span className="text-destructive">*</span>
              </label>
              <Input
                id="editCode"
                type="text"
                placeholder="abcd1234"
                value={editCode}
                onChange={(e) => setEditCode(e.target.value)}
                disabled={isAuthenticating}
              />
              <p className="text-xs text-muted-foreground">
                回答時に発行された編集コードを入力してください
              </p>
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={isAuthenticating}
        >
          {isAuthenticating ? '認証中...' : '認証して編集'}
        </Button>
      </form>
    )
  }

  // 認証後の編集画面
  return (
    <form onSubmit={handleUpdate} className="flex flex-col gap-6">
      {/* 認証済み表示 */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <p className="text-sm text-green-800">
          認証成功：{participantName} さんの回答を編集中
        </p>
      </div>

      {/* カレンダー */}
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">
          予定を選択 <span className="text-destructive">*</span>
        </h2>
        <p className="text-sm text-muted-foreground">
          参加可能な時間帯をドラッグまたはタップで選択してください
        </p>
        <Calendar
          candidateDates={candidateDates}
          selectedSlots={selectedSlotsMap}
          onSelectionChange={handleSelectionChange}
          showInstructions={true}
        />
      </div>

      {/* 選択状況 */}
      {totalSelectedSlots > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            {totalSelectedSlots}個の時間帯を選択中
          </p>
        </div>
      )}

      {/* エラーメッセージ */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* 更新ボタン */}
      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={isSubmitting}
      >
        {isSubmitting ? '更新中...' : '回答を更新'}
      </Button>
    </form>
  )
}
