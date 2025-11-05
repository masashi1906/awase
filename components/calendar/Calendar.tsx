'use client'

import { useMemo } from 'react'
import { TimeSlotCell } from './TimeSlotCell'
import { useCalendarTouch } from './hooks/useCalendarTouch'
import { usePointerDrag } from './hooks/usePointerDrag'
import { Card, CardContent } from '@/components/ui/card'
import { formatDateWithDay } from '@/lib/utils/dateUtils'
import { generateTimeSlots } from '@/lib/utils/timeSlotCalculator'
import type { CandidateDate, TimeSlot } from '@/types'

export interface CalendarProps {
  candidateDates: CandidateDate[]
  selectedSlots: Map<string, Set<string>>
  onSelectionChange: (date: string, slots: Set<string>) => void
  participantCounts?: Map<string, Map<string, number>>
  showInstructions?: boolean
}

export function Calendar({
  candidateDates,
  selectedSlots,
  onSelectionChange,
  participantCounts,
  showInstructions = true,
}: CalendarProps) {
  const hasCandidates = candidateDates.length > 0

  const unifiedRange = useMemo(() => {
    if (!hasCandidates) {
      return { start: '00:00', end: '00:00' }
    }

    const startTimes = [...candidateDates]
      .map((date) => date.start_time)
      .sort()
    const endTimes = [...candidateDates]
      .map((date) => date.end_time)
      .sort()

    return {
      start: startTimes[0],
      end: endTimes[endTimes.length - 1],
    }
  }, [candidateDates, hasCandidates])

  const timeSlots = useMemo(() => {
    if (!hasCandidates) {
      return []
    }

    return generateTimeSlots(unifiedRange.start, unifiedRange.end)
  }, [hasCandidates, unifiedRange.end, unifiedRange.start])

  const toggleSlot = (slot: TimeSlot) => {
    const current = selectedSlots.get(slot.date) ?? new Set<string>()
    const next = new Set(current)

    if (next.has(slot.time)) {
      next.delete(slot.time)
    } else {
      next.add(slot.time)
    }

    onSelectionChange(slot.date, next)
  }

  const isSlotSelected = (slot: TimeSlot) => {
    return selectedSlots.get(slot.date)?.has(slot.time) ?? false
  }

  const {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleTouchCancel,
    isSelecting,
  } = useCalendarTouch({
    onToggleSlot: toggleSlot,
    isSlotSelected,
  })

  const {
    handlePointerDown,
    handlePointerEnter,
    handlePointerUp,
    handlePointerCancel,
  } = usePointerDrag({
    onToggleSlot: toggleSlot,
    isSlotSelected,
  })

  const wrapperTouchAction = isSelecting ? 'none' : 'pan-y'

  if (!hasCandidates) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">候補日がありません</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {showInstructions && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">使い方</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• PC: クリックまたはドラッグで選択</li>
            <li>• モバイル: タップで選択、長押ししてドラッグで連続選択</li>
          </ul>
        </div>
      )}

      <Card>
        <CardContent className="p-0 overflow-hidden">
          <div
            className="overflow-x-auto"
            style={{ touchAction: wrapperTouchAction }}
          >
            <table className="min-w-full border-collapse">
              <thead>
                <tr>
                  <th className="sticky left-0 top-0 z-20 bg-white border-b border-r border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-600">
                    時間
                  </th>
                  {candidateDates.map((date) => (
                    <th
                      key={date.id}
                      className="top-0 z-10 min-w-[120px] border-b border-gray-300 px-3 py-2 text-center text-sm font-medium text-gray-700"
                    >
                      {formatDateWithDay(date.date)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timeSlots.map((time) => (
                  <tr key={time}>
                    <td className="sticky left-0 z-10 bg-white border-b border-r border-gray-200 px-3 py-2 text-sm text-gray-600">
                      {time}
                    </td>
                    {candidateDates.map((candidateDate) => {
                      const slot: TimeSlot = {
                        date: candidateDate.date,
                        time,
                      }

                      const participantCount = participantCounts
                        ?.get(candidateDate.date)
                        ?.get(time)

                      const isWithinRange =
                        time >= candidateDate.start_time &&
                        time < candidateDate.end_time

                      return (
                        <td
                          key={`${candidateDate.id}-${time}`}
                          className="p-0"
                        >
                          <TimeSlotCell
                            slot={slot}
                            isSelected={isSlotSelected(slot)}
                            participantCount={participantCount}
                            isDisabled={!isWithinRange}
                            onTouchStart={handleTouchStart}
                            onTouchMove={handleTouchMove}
                            onTouchEnd={handleTouchEnd}
                            onTouchCancel={handleTouchCancel}
                            onPointerDown={handlePointerDown}
                            onPointerEnter={handlePointerEnter}
                            onPointerUp={handlePointerUp}
                            onPointerCancel={handlePointerCancel}
                          />
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
