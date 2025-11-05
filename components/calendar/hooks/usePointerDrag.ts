import { useCallback, useRef } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import type { TimeSlot } from '@/types'

type DragMode = 'select' | 'deselect'

interface UsePointerDragProps {
  onToggleSlot: (slot: TimeSlot) => void
  isSlotSelected: (slot: TimeSlot) => boolean
}

export function usePointerDrag({
  onToggleSlot,
  isSlotSelected,
}: UsePointerDragProps) {
  const isPointerDownRef = useRef(false)
  const dragModeRef = useRef<DragMode>('select')
  const lastSlotRef = useRef<TimeSlot | null>(null)

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent, slot: TimeSlot) => {
      if (event.button !== 0) return

      event.preventDefault()

      isPointerDownRef.current = true
      lastSlotRef.current = slot

      const selected = isSlotSelected(slot)
      dragModeRef.current = selected ? 'deselect' : 'select'

      onToggleSlot(slot)
    },
    [isSlotSelected, onToggleSlot]
  )

  const handlePointerEnter = useCallback(
    (_event: ReactPointerEvent, slot: TimeSlot) => {
      if (!isPointerDownRef.current) return

      const lastSlot = lastSlotRef.current
      const isSameSlot =
        lastSlot?.date === slot.date && lastSlot?.time === slot.time

      if (isSameSlot) return

      lastSlotRef.current = slot

      if (dragModeRef.current === 'select') {
        if (!isSlotSelected(slot)) {
          onToggleSlot(slot)
        }
      } else {
        if (isSlotSelected(slot)) {
          onToggleSlot(slot)
        }
      }
    },
    [isSlotSelected, onToggleSlot]
  )

  const handlePointerUp = useCallback(() => {
    isPointerDownRef.current = false
    lastSlotRef.current = null
  }, [])

  const handlePointerCancel = useCallback(() => {
    isPointerDownRef.current = false
    lastSlotRef.current = null
  }, [])

  return {
    handlePointerDown,
    handlePointerEnter,
    handlePointerUp,
    handlePointerCancel,
  }
}
