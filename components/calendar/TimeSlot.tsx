'use client'

import { cn } from '@/lib/utils'

export interface TimeSlotProps {
  time: string // "09:00", "09:30", etc.
  isSelected: boolean
  participantCount?: number
  onPointerDown?: () => void
  onPointerEnter?: () => void
  onPointerUp?: () => void
  className?: string
}

/**
 * 30分単位のタイムスロット
 * ドラッグ選択に対応したインタラクティブなセル
 */
export function TimeSlot({
  time,
  isSelected,
  participantCount = 0,
  onPointerDown,
  onPointerEnter,
  onPointerUp,
  className,
}: TimeSlotProps) {
  return (
    <div
      className={cn(
        'relative h-12 border-b border-r border-gray-200 transition-colors select-none cursor-pointer',
        'hover:bg-gray-50',
        isSelected && 'bg-primary/10 border-primary/30 hover:bg-primary/20',
        className
      )}
      onPointerDown={onPointerDown}
      onPointerEnter={onPointerEnter}
      onPointerUp={onPointerUp}
      // タッチデバイスでのデフォルト動作を防ぐ
      onTouchStart={(e) => e.preventDefault()}
    >
      {/* 参加可能人数バッジ */}
      {participantCount > 0 && (
        <div className="absolute top-1 right-1 flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-secondary rounded-full">
          <span className="text-xs font-medium text-white">
            {participantCount}
          </span>
        </div>
      )}

      {/* 選択インジケーター */}
      {isSelected && (
        <div className="absolute inset-0 border-2 border-primary rounded-sm pointer-events-none" />
      )}
    </div>
  )
}
