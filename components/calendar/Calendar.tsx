'use client'

import { TimeGrid } from './TimeGrid'
import { Card, CardContent } from '@/components/ui/card'
import type { CandidateDate } from '@/types'

export interface CalendarProps {
  candidateDates: CandidateDate[]
  selectedSlots: Map<string, Set<string>> // Map of date -> Set of selected times
  onSelectionChange: (date: string, slots: Set<string>) => void
  participantCounts?: Map<string, Map<string, number>> // Map of date -> Map of time -> count
  showInstructions?: boolean
}

/**
 * カレンダーコンポーネント
 * スケジュール調整のメインUI
 */
export function Calendar({
  candidateDates,
  selectedSlots,
  onSelectionChange,
  participantCounts,
  showInstructions = true,
}: CalendarProps) {
  if (candidateDates.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">
            候補日がありません
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* 使い方の説明 */}
      {showInstructions && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">
            使い方
          </h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• タップまたはクリックで時間帯を選択</li>
            <li>• ドラッグで連続選択が可能</li>
            <li>• 選択済みの時間帯をもう一度タップで解除</li>
          </ul>
          <div className="mt-3 pt-3 border-t border-blue-200">
            <h4 className="text-sm font-medium text-blue-900 mb-1">
              📱 スマホでのスクロール
            </h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>横スクロール</strong>：日付の行（色付き部分）をドラッグ</li>
              <li>• <strong>縦スクロール</strong>：時間の列（左側の色付き部分）をドラッグ</li>
            </ul>
          </div>
        </div>
      )}

      {/* カレンダーグリッド */}
      <Card>
        <CardContent className="p-0 overflow-hidden">
          <TimeGrid
            candidateDates={candidateDates}
            selectedSlots={selectedSlots}
            onSelectionChange={onSelectionChange}
            participantCounts={participantCounts}
          />
        </CardContent>
      </Card>
    </div>
  )
}
