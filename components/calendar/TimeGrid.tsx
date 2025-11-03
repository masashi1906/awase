'use client'

import { useState, useCallback } from 'react'
import { DayColumn } from './DayColumn'
import { generateTimeSlots } from '@/lib/utils/timeSlotCalculator'
import { ChevronsLeftRight, ChevronsUpDown } from 'lucide-react'
import type { CandidateDate } from '@/types'

export interface TimeGridProps {
  candidateDates: CandidateDate[]
  selectedSlots: Map<string, Set<string>> // Map of date -> Set of selected times
  onSelectionChange: (date: string, slots: Set<string>) => void
  participantCounts?: Map<string, Map<string, number>> // Map of date -> Map of time -> count
}

/**
 * カレンダーグリッド本体
 * 複数の候補日を横に並べて表示し、ドラッグ選択を管理
 */
export function TimeGrid({
  candidateDates,
  selectedSlots,
  onSelectionChange,
  participantCounts,
}: TimeGridProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [dragMode, setDragMode] = useState<'select' | 'deselect'>('select')
  const [currentDate, setCurrentDate] = useState<string | null>(null)

  const handleDragStart = useCallback(
    (date: string, time: string) => {
      setIsDragging(true)
      setCurrentDate(date)

      const dateSlots = selectedSlots.get(date) || new Set<string>()
      const isCurrentlySelected = dateSlots.has(time)

      // ドラッグモードを決定：選択済みなら解除モード、未選択なら選択モード
      setDragMode(isCurrentlySelected ? 'deselect' : 'select')
    },
    [selectedSlots]
  )

  const handleDragMove = useCallback(
    (date: string, time: string) => {
      if (!isDragging || date !== currentDate) return

      const dateSlots = new Set(selectedSlots.get(date) || [])

      if (dragMode === 'select') {
        dateSlots.add(time)
      } else {
        dateSlots.delete(time)
      }

      onSelectionChange(date, dateSlots)
    },
    [isDragging, currentDate, dragMode, selectedSlots, onSelectionChange]
  )

  const handleDragEnd = useCallback(() => {
    setIsDragging(false)
    setCurrentDate(null)
  }, [])

  const handleSlotToggle = useCallback(
    (date: string, time: string) => {
      const dateSlots = new Set(selectedSlots.get(date) || [])

      if (dateSlots.has(time)) {
        dateSlots.delete(time)
      } else {
        dateSlots.add(time)
      }

      onSelectionChange(date, dateSlots)
    },
    [selectedSlots, onSelectionChange]
  )

  // 全候補日の時刻範囲を統一（最も早い開始時刻〜最も遅い終了時刻）
  const getUnifiedTimeRange = () => {
    const allStartTimes = candidateDates.map((d) => d.start_time)
    const allEndTimes = candidateDates.map((d) => d.end_time)

    const earliestStart = allStartTimes.sort()[0]
    const latestEnd = allEndTimes.sort().reverse()[0]

    return { start: earliestStart, end: latestEnd }
  }

  const { start: unifiedStart, end: unifiedEnd } = getUnifiedTimeRange()
  const timeSlots = generateTimeSlots(unifiedStart, unifiedEnd)

  return (
    <div className="flex flex-col">
      {/* 時刻ラベル + グリッド */}
      <div className="flex overflow-x-auto">
        {/* 時刻ラベル列 */}
        <div className="flex flex-col sticky left-0 z-20 bg-blue-50/50 border-r-2 border-gray-300">
          {/* ヘッダー空白（横スクロールヒント） */}
          <div className="h-[52px] border-b-2 border-gray-300 flex items-center justify-center relative bg-gradient-to-br from-blue-50 to-indigo-50">
            <ChevronsLeftRight className="w-4 h-4 text-blue-600/60 absolute" />
          </div>

          {/* 時刻ラベル */}
          {timeSlots.map((time, index) => (
            <div
              key={time}
              className="h-12 border-b border-gray-200 flex items-center justify-end pr-2 min-w-[60px] relative"
            >
              <span className="text-xs text-gray-600">
                {index % 2 === 0 ? time : ''}
              </span>
              {/* 最初と最後の時間帯に上下スクロールアイコンを表示 */}
              {index === 0 && (
                <ChevronsUpDown className="w-3 h-3 text-blue-600/40 absolute left-1" />
              )}
            </div>
          ))}
        </div>

        {/* 候補日列 */}
        <div className="flex">
          {candidateDates.map((candidateDate) => (
            <DayColumn
              key={candidateDate.id}
              date={candidateDate.date}
              startTime={unifiedStart}
              endTime={unifiedEnd}
              selectedSlots={selectedSlots.get(candidateDate.date) || new Set()}
              participantCounts={participantCounts?.get(candidateDate.date)}
              onSlotToggle={(time) => handleSlotToggle(candidateDate.date, time)}
              onDragStart={(time) => handleDragStart(candidateDate.date, time)}
              onDragMove={(time) => handleDragMove(candidateDate.date, time)}
              onDragEnd={handleDragEnd}
            />
          ))}
        </div>
      </div>

      {/* ドラッグ中の視覚的フィードバック */}
      {isDragging && (
        <div className="mt-2 text-sm text-muted-foreground text-center">
          {dragMode === 'select' ? '選択中...' : '選択解除中...'}
        </div>
      )}
    </div>
  )
}
