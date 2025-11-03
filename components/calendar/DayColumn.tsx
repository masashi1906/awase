'use client'

import { TimeSlot } from './TimeSlot'
import { formatDateWithDay } from '@/lib/utils/dateUtils'
import { generateTimeSlots } from '@/lib/utils/timeSlotCalculator'

export interface DayColumnProps {
  date: string // "2024-01-15"
  startTime: string // "09:00"
  endTime: string // "18:00"
  selectedSlots: Set<string> // Set of selected time strings like "09:00", "09:30"
  participantCounts?: Map<string, number> // Map of time -> participant count
  onSlotToggle: (time: string) => void
  onDragStart: (time: string) => void
  onDragMove: (time: string) => void
  onDragEnd: () => void
}

/**
 * 1日分のタイムスロットを縦に並べた列
 * ドラッグ選択のロジックを管理
 */
export function DayColumn({
  date,
  startTime,
  endTime,
  selectedSlots,
  participantCounts,
  onSlotToggle,
  onDragStart,
  onDragMove,
  onDragEnd,
}: DayColumnProps) {
  const timeSlots = generateTimeSlots(startTime, endTime)

  return (
    <div className="flex flex-col min-w-[100px]">
      {/* 日付ヘッダー */}
      <div className="sticky top-0 z-10 bg-white border-b-2 border-gray-300 p-2">
        <div className="text-sm font-medium text-center">
          {formatDateWithDay(date)}
        </div>
      </div>

      {/* タイムスロット一覧 */}
      <div className="flex-1">
        {timeSlots.map((time) => {
          const slotKey = `${date}_${time}`
          return (
            <TimeSlot
              key={slotKey}
              time={time}
              isSelected={selectedSlots.has(time)}
              participantCount={participantCounts?.get(time) || 0}
              onPointerDown={() => {
                onSlotToggle(time)
                onDragStart(time)
              }}
              onPointerEnter={() => onDragMove(time)}
              onPointerUp={onDragEnd}
            />
          )
        })}
      </div>
    </div>
  )
}
