import { useCallback, useRef, useState } from 'react'
import type { TouchEvent as ReactTouchEvent } from 'react'
import type { TimeSlot } from '@/types'

type TouchMode = 'idle' | 'pending' | 'scrolling' | 'selecting'

interface TouchState {
  mode: TouchMode
  startPosition: { x: number; y: number } | null
  longPressTimer: ReturnType<typeof setTimeout> | null
  initialSelection: boolean
}

const LONG_PRESS_DELAY = 500
const MOVE_THRESHOLD = 10
const VIBRATION_DURATION = 50

interface UseCalendarTouchProps {
  onToggleSlot: (slot: TimeSlot) => void
  isSlotSelected: (slot: TimeSlot) => boolean
}

export function useCalendarTouch({
  onToggleSlot,
  isSlotSelected,
}: UseCalendarTouchProps) {
  const [touchState, setTouchState] = useState<TouchState>({
    mode: 'idle',
    startPosition: null,
    longPressTimer: null,
    initialSelection: false,
  })

  const currentSlotRef = useRef<TimeSlot | null>(null)

  const handleTouchStart = useCallback(
    (event: ReactTouchEvent, slot: TimeSlot) => {
      if (event.touches.length === 0) return

      const touch = event.touches[0]
      currentSlotRef.current = slot

      const timer = setTimeout(() => {
        setTouchState((prev) => ({
          ...prev,
          mode: 'selecting',
        }))

        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          navigator.vibrate?.(VIBRATION_DURATION)
        }

        onToggleSlot(slot)
      }, LONG_PRESS_DELAY)

      setTouchState({
        mode: 'pending',
        startPosition: { x: touch.clientX, y: touch.clientY },
        initialSelection: isSlotSelected(slot),
        longPressTimer: timer,
      })
    },
    [isSlotSelected, onToggleSlot]
  )

  const handleTouchMove = useCallback(
    (event: ReactTouchEvent, slot: TimeSlot) => {
      if (touchState.mode === 'idle') return

      if (touchState.mode === 'pending') {
        const touch = event.touches[0]
        const startPosition = touchState.startPosition

        if (!startPosition) return

        const deltaX = Math.abs(touch.clientX - startPosition.x)
        const deltaY = Math.abs(touch.clientY - startPosition.y)

        if (deltaX > MOVE_THRESHOLD || deltaY > MOVE_THRESHOLD) {
          if (touchState.longPressTimer) {
            clearTimeout(touchState.longPressTimer)
          }

          setTouchState((prev) => ({
            ...prev,
            mode: 'scrolling',
            longPressTimer: null,
          }))
        }
        return
      }

      if (touchState.mode === 'selecting') {
        event.preventDefault()

        const currentSlot = currentSlotRef.current
        const isDifferentSlot =
          !currentSlot ||
          currentSlot.date !== slot.date ||
          currentSlot.time !== slot.time

        if (!isDifferentSlot) return

        currentSlotRef.current = slot
        const isCurrentlySelected = isSlotSelected(slot)

        if (touchState.initialSelection) {
          if (isCurrentlySelected) {
            onToggleSlot(slot)
          }
        } else {
          if (!isCurrentlySelected) {
            onToggleSlot(slot)
          }
        }
      }
    },
    [isSlotSelected, onToggleSlot, touchState]
  )

  const handleTouchEnd = useCallback(
    (slot: TimeSlot) => {
      setTouchState((prev) => {
        if (prev.longPressTimer) {
          clearTimeout(prev.longPressTimer)
        }

        if (prev.mode === 'pending') {
          onToggleSlot(slot)
        }

        return {
          mode: 'idle',
          startPosition: null,
          longPressTimer: null,
          initialSelection: false,
        }
      })
      currentSlotRef.current = null
    },
    [onToggleSlot]
  )

  const handleTouchCancel = useCallback(() => {
    setTouchState((prev) => {
      if (prev.longPressTimer) {
        clearTimeout(prev.longPressTimer)
      }

      return {
        mode: 'idle',
        startPosition: null,
        longPressTimer: null,
        initialSelection: false,
      }
    })
    currentSlotRef.current = null
  }, [])

  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleTouchCancel,
    isSelecting: touchState.mode === 'selecting',
  }
}
