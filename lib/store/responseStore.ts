import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  ResponseStore,
  TimeSlot,
  AvailabilityBlockInput,
  AvailabilityBlock,
} from '@/types'
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

      toggleSlot: (slot: TimeSlot) =>
        set((state) => {
          const exists = state.selectedSlots.some(
            (s) => s.date === slot.date && s.time === slot.time
          )

          if (exists) {
            return {
              selectedSlots: state.selectedSlots.filter(
                (s) => !(s.date === slot.date && s.time === slot.time)
              ),
            }
          }

          return {
            selectedSlots: [...state.selectedSlots, slot],
          }
        }),

      addSlotRange: (slots: TimeSlot[]) =>
        set((state) => {
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

      removeSlotRange: (slots: TimeSlot[]) =>
        set((state) => ({
          selectedSlots: state.selectedSlots.filter(
            (s) =>
              !slots.some(
                (slot) => slot.date === s.date && slot.time === s.time
              )
          ),
        })),

      clearAllSlots: () => set({ selectedSlots: [] }),

      isSlotSelected: (slot: TimeSlot) => {
        return get().selectedSlots.some(
          (s) => s.date === slot.date && s.time === slot.time
        )
      },

      getAvailabilityBlocks: (): AvailabilityBlockInput[] => {
        const slots = get().selectedSlots
        return mergeConsecutiveSlots(slots).map((block) => ({
          date: block.date,
          start_time: block.start_time,
          end_time: block.end_time,
        }))
      },

      loadFromResponse: (blocks: AvailabilityBlock[]) => {
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
