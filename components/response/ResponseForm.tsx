'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Calendar } from '@/components/calendar'
import { useResponseStore } from '@/lib/store/responseStore'
import type { CandidateDate, TimeSlot } from '@/types'

interface ResponseFormProps {
  eventSlug: string
  candidateDates: CandidateDate[]
}

/**
 * 回答フォーム
 * カレンダーで予定を選択して送信
 */
export function ResponseForm({ eventSlug, candidateDates }: ResponseFormProps) {
  const router = useRouter()
  const {
    participantName,
    selectedSlots,
    setParticipantName,
    getAvailabilityBlocks,
    reset,
  } = useResponseStore()
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
    // 現在の selectedSlots から該当日付を除外
    const otherSlots = selectedSlots.filter((slot) => slot.date !== date)

    // 新しい選択を TimeSlot[] に変換
    const newSlots: TimeSlot[] = Array.from(times).map((time) => ({
      date,
      time,
    }))

    // Zustand に保存（手動で更新）
    useResponseStore.setState({
      selectedSlots: [...otherSlots, ...newSlots],
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // バリデーション
    if (!participantName.trim()) {
      setError('名前を入力してください')
      return
    }

    if (selectedSlots.length === 0) {
      setError('少なくとも1つの時間帯を選択してください')
      return
    }

    setIsSubmitting(true)

    try {
      // 連続した時間を結合してAvailabilityBlock[]に変換
      const blocks = getAvailabilityBlocks()

      const response = await fetch(`/api/events/${eventSlug}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participant_name: participantName.trim(),
          availability_blocks: blocks,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || '送信に失敗しました')
      }

      // ストアをリセット
      reset()

      // 成功したらイベント詳細ページに戻る
      router.push(`/event/${eventSlug}?success=true`)
    } catch (err) {
      setError(err instanceof Error ? err.message : '送信に失敗しました')
      setIsSubmitting(false)
    }
  }

  // 選択した時間帯の合計数を計算
  const totalSelectedSlots = selectedSlots.length

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* 名前入力 */}
      <Card>
        <CardContent className="pt-6">
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
              disabled={isSubmitting}
            />
          </div>
        </CardContent>
      </Card>

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
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-800">
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

      {/* 送信ボタン */}
      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={isSubmitting}
      >
        {isSubmitting ? '送信中...' : '回答を送信'}
      </Button>
    </form>
  )
}
