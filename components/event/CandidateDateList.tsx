'use client'

import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatDateWithDay } from '@/lib/utils/dateUtils'
import type { CandidateDateInput } from '@/types'

interface CandidateDateListProps {
  candidateDates: CandidateDateInput[]
  onRemove: (index: number) => void
}

/**
 * 候補日リスト（削除ボタン付き）
 */
export function CandidateDateList({
  candidateDates,
  onRemove,
}: CandidateDateListProps) {
  if (candidateDates.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p className="text-sm">候補日が追加されていません</p>
        <p className="text-xs mt-1">下のフォームから候補日を追加してください</p>
      </div>
    )
  }

  const handleRemove = (index: number, date: CandidateDateInput) => {
    const confirmed = window.confirm(
      `以下の候補日を削除しますか？\n\n` +
        `${formatDateWithDay(date.date)}\n` +
        `${date.start_time} - ${date.end_time}\n\n` +
        `⚠️ この候補日への参加者の回答も削除されます。\n` +
        `この操作は取り消せません。`
    )

    if (confirmed) {
      onRemove(index)
    }
  }

  return (
    <div className="space-y-2">
      {candidateDates.map((date, index) => (
        <div
          key={index}
          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
        >
          <div>
            <p className="font-medium text-gray-900">
              {formatDateWithDay(date.date)}
            </p>
            <p className="text-sm text-gray-600">
              {date.start_time} - {date.end_time}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleRemove(index, date)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ))}
    </div>
  )
}
