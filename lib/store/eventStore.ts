import { create } from 'zustand'
import type { EventStore, CandidateDateInput } from '@/types'

/**
 * イベント作成フォーム用のストア
 * イベント作成画面で使用する状態を管理
 */
export const useEventStore = create<EventStore>((set) => ({
  title: '',
  description: '',
  candidateDates: [],

  setTitle: (title) => set({ title }),

  setDescription: (description) => set({ description }),

  addCandidateDate: (date) =>
    set((state) => ({
      candidateDates: [...state.candidateDates, date],
    })),

  removeCandidateDate: (index) =>
    set((state) => ({
      candidateDates: state.candidateDates.filter((_, i) => i !== index),
    })),

  updateCandidateDate: (index, updates) =>
    set((state) => ({
      candidateDates: state.candidateDates.map((date, i) =>
        i === index ? { ...date, ...updates } : date
      ),
    })),

  clearForm: () =>
    set({
      title: '',
      description: '',
      candidateDates: [],
    }),
}))
