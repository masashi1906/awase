import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ResponseStore, TimeSlot, AvailabilityBlockInput, AvailabilityBlock } from '@/types'
import { mergeConsecutiveSlots, expandBlocksToSlots } from '@/lib/utils/timeSlotCalculator'

/**
 * 回答選択用のストア（localStorage連携）
 * カレンダーでの時間選択状態を管理
 */
export const useResponseStore = create<ResponseStore>()(
  persist(
    (set, get) => ({
      participantName: '',
      selectedSlots: [],

      setParticipantName: (name) => set({ participantName: name }),

      toggleSlot: (slot) =>
        set((state) => {
          const exists = state.selectedSlots.some(
            (s) => s.date === slot.date && s.time === slot.time
          )

          if (exists) {
            // 選択解除
            return {
              selectedSlots: state.selectedSlots.filter(
                (s) => !(s.date === slot.date && s.time === slot.time)
              ),
            }
          } else {
            // 選択
            return {
              selectedSlots: [...state.selectedSlots, slot],
            }
          }
        }),

      addSlotRange: (slots) =>
        set((state) => {
          // 重複を避けて追加
          const newSlots = slots.filter(
            (slot) =>
              !state.selectedSlots.some(
                (s) => s.date === slot.date && s.time === slot.time
              )
          )
          return {
            selectedSlots: [...state.selectedSlots, ...newSlots],
          }
        }),

      removeSlotRange: (slots) =>
        set((state) => ({
          selectedSlots: state.selectedSlots.filter(
            (s) =>
              !slots.some(
                (slot) => slot.date === s.date && slot.time === s.time
              )
          ),
        })),

      clearAllSlots: () => set({ selectedSlots: [] }),

      isSlotSelected: (slot) => {
        return get().selectedSlots.some(
          (s) => s.date === slot.date && s.time === slot.time
        )
      },

      getAvailabilityBlocks: () => {
        const slots = get().selectedSlots
        return mergeConsecutiveSlots(slots)
      },

      loadFromResponse: (blocks) => {
        // AvailabilityBlock[] を TimeSlot[] に展開
        const slots = expandBlocksToSlots(blocks)
        set({ selectedSlots: slots })
      },

      reset: () =>
        set({
          participantName: '',
          selectedSlots: [],
        }),
    }),
    {
      name: 'awase-response-storage',
    }
  )
)
