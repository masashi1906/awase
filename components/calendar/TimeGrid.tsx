'use client'

import { useState, useCallback, useRef } from 'react'
import { DayColumn } from './DayColumn'
import { generateTimeSlots } from '@/lib/utils/timeSlotCalculator'
import type { CandidateDate } from '@/types'

export interface TimeGridProps {
  candidateDates: CandidateDate[]
  selectedSlots: Map<string, Set<string>> // Map of date -> Set of selected times
  onSelectionChange: (date: string, slots: Set<string>) => void
  participantCounts?: Map<string, Map<string, number>> // Map of date -> Map of time -> count
}

interface TouchStartPosition {
  x: number
  y: number
  time: number
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
  const touchStartPos = useRef<TouchStartPosition | null>(null)
  const [isScrolling, setIsScrolling] = useState(false)

  const handleDragStart = useCallback(
    (date: string, time: string, clientX?: number, clientY?: number) => {
      // タッチ開始位置を記録
      if (clientX !== undefined && clientY !== undefined) {
        touchStartPos.current = {
          x: clientX,
          y: clientY,
          time: Date.now(),
        }
      }

      setIsScrolling(false)
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
      if (!isDragging || date !== currentDate || isScrolling) return

      const dateSlots = new Set(selectedSlots.get(date) || [])

      if (dragMode === 'select') {
        dateSlots.add(time)
      } else {
        dateSlots.delete(time)
      }

      onSelectionChange(date, dateSlots)
    },
    [isDragging, currentDate, dragMode, selectedSlots, onSelectionChange, isScrolling]
  )

  const handleDragEnd = useCallback(() => {
    setIsDragging(false)
    setCurrentDate(null)
    touchStartPos.current = null
    setIsScrolling(false)
  }, [])

  const handleDragCancel = useCallback(() => {
    setIsDragging(false)
    setCurrentDate(null)
    touchStartPos.current = null
    setIsScrolling(false)
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
      <div
        className="flex overflow-x-auto"
        style={{
          touchAction: isDragging ? 'none' : 'auto'
        }}
        onTouchMove={(e) => {
          // タッチ移動時にスクロール意図を判定
          if (!touchStartPos.current || !isDragging) return

          const touch = e.touches[0]
          const deltaX = Math.abs(touch.clientX - touchStartPos.current.x)
          const deltaY = Math.abs(touch.clientY - touchStartPos.current.y)

          // 横方向の移動が縦方向より大きい場合は横スクロールと判定
          if (deltaX > deltaY && deltaX > 10) {
            setIsScrolling(true)
            handleDragCancel()
          }
        }}
      >
        {/* 時刻ラベル列 */}
        <div className="flex flex-col sticky left-0 z-20 bg-white border-r-2 border-gray-300">
          {/* ヘッダー空白 */}
          <div className="h-[52px] border-b-2 border-gray-300" />

          {/* 時刻ラベル */}
          {timeSlots.map((time, index) => (
            <div
              key={time}
              className="h-12 border-b border-gray-200 flex items-center justify-end pr-2 min-w-[60px]"
            >
              <span className="text-xs text-gray-600">
                {index % 2 === 0 ? time : ''}
              </span>
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
              onDragStart={(time, clientX, clientY) => handleDragStart(candidateDate.date, time, clientX, clientY)}
              onDragMove={(time) => handleDragMove(candidateDate.date, time)}
              onDragEnd={handleDragEnd}
              onDragCancel={handleDragCancel}
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
