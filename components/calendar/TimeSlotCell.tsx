'use client'

import { memo } from 'react'
import type {
  PointerEvent as ReactPointerEvent,
  TouchEvent as ReactTouchEvent,
} from 'react'
import { cn } from '@/lib/utils'
import type { TimeSlot } from '@/types'

interface TimeSlotCellProps {
  slot: TimeSlot
  isSelected: boolean
  participantCount?: number
  isDisabled?: boolean
  onTouchStart: (event: ReactTouchEvent, slot: TimeSlot) => void
  onTouchMove: (event: ReactTouchEvent, slot: TimeSlot) => void
  onTouchEnd: (slot: TimeSlot) => void
  onTouchCancel: () => void
  onPointerDown: (event: ReactPointerEvent, slot: TimeSlot) => void
  onPointerEnter: (event: ReactPointerEvent, slot: TimeSlot) => void
  onPointerUp: () => void
  onPointerCancel: () => void
}

export const TimeSlotCell = memo(function TimeSlotCell({
  slot,
  isSelected,
  participantCount = 0,
  isDisabled = false,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  onTouchCancel,
  onPointerDown,
  onPointerEnter,
  onPointerUp,
  onPointerCancel,
}: TimeSlotCellProps) {
  const handleTouchStart = (event: ReactTouchEvent) => {
    if (isDisabled) return
    onTouchStart(event, slot)
  }

  const handleTouchMove = (event: ReactTouchEvent) => {
    if (isDisabled) return
    onTouchMove(event, slot)
  }

  const handleTouchEnd = () => {
    if (isDisabled) return
    onTouchEnd(slot)
  }

  const handlePointerDown = (event: ReactPointerEvent) => {
    if (isDisabled) return
    onPointerDown(event, slot)
  }

  const handlePointerEnter = (event: ReactPointerEvent) => {
    if (isDisabled) return
    onPointerEnter(event, slot)
  }

  return (
    <div
      role="button"
      aria-pressed={isSelected}
      tabIndex={-1}
      className={cn(
        'relative h-12 border-b border-r border-gray-200 transition-colors select-none',
        isDisabled
          ? 'bg-gray-100 cursor-not-allowed'
          : 'cursor-pointer hover:bg-gray-50',
        isSelected && !isDisabled && 'bg-primary/10 border-primary/30 hover:bg-primary/20'
      )}
      data-date={slot.date}
      data-time={slot.time}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={onTouchCancel}
      onPointerDown={handlePointerDown}
      onPointerEnter={handlePointerEnter}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    >
      {participantCount > 0 && !isDisabled && (
        <div className="absolute top-1 right-1 flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-secondary rounded-full">
          <span className="text-xs font-medium text-white">{participantCount}</span>
        </div>
      )}

      {isSelected && !isDisabled && (
        <div className="absolute inset-0 border-2 border-primary rounded-sm pointer-events-none" />
      )}
    </div>
  )
})
