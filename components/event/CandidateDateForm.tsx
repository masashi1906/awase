'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Plus } from 'lucide-react'
import type { CandidateDateInput } from '@/types'

interface CandidateDateFormProps {
  onAdd: (date: CandidateDateInput) => void
}

/**
 * 候補日追加フォーム
 * 日付と時間範囲を入力して候補日を追加する
 */
export function CandidateDateForm({ onAdd }: CandidateDateFormProps) {
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('18:00')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // バリデーション
    if (!date) {
      setError('日付を選択してください')
      return
    }

    if (startTime >= endTime) {
      setError('開始時刻は終了時刻より前にしてください')
      return
    }

    // 候補日を追加
    onAdd({
      date,
      start_time: startTime,
      end_time: endTime,
    })

    // フォームをリセット
    setDate('')
    setStartTime('09:00')
    setEndTime('18:00')
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="date" className="text-sm font-medium">
              日付
            </label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="startTime" className="text-sm font-medium">
                開始時刻
              </label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="endTime" className="text-sm font-medium">
                終了時刻
              </label>
              <Input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <Button type="submit" variant="outline" className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            候補日を追加
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
