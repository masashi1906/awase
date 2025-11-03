/**
 * 共通型定義
 */

// ============================================
// イベント関連の型
// ============================================

export interface Event {
  id: string
  title: string
  description: string | null
  url_slug: string
  created_at: string
  expires_at: string
}

export interface CandidateDate {
  id: string
  event_id: string
  date: string // "2025-11-05"
  start_time: string // "09:00"
  end_time: string // "18:00"
  created_at: string
}

export interface Response {
  id: string
  event_id: string
  participant_name: string
  edit_code: string
  created_at: string
  updated_at: string
}

export interface AvailabilityBlock {
  id: string
  response_id: string
  date: string
  start_time: string
  end_time: string
  created_at: string
}

// ============================================
// フォーム関連の型
// ============================================

export interface EventFormData {
  title: string
  description: string
  candidateDates: CandidateDateInput[]
}

export interface CandidateDateInput {
  date: string
  start_time: string
  end_time: string
}

export interface ResponseFormData {
  participant_name: string
  availability_blocks: AvailabilityBlockInput[]
}

export interface AvailabilityBlockInput {
  date: string
  start_time: string
  end_time: string
}

export interface EditFormData {
  participant_name: string
  edit_code: string
}

// ============================================
// カレンダーUI関連の型
// ============================================

export interface TimeSlot {
  date: string // "2025-11-05"
  time: string // "10:00"
}

export interface DayColumnData {
  date: string
  start_time: string
  end_time: string
  timeSlots: string[]
}

export interface ParticipantCount {
  [key: string]: number // "2025-11-05-10:00" -> 6
}

// ============================================
// API レスポンスの型
// ============================================

export interface CreateEventResponse {
  slug: string
  url: string
}

export interface CreateResponseResponse {
  response_id: string
  edit_code: string
}

export interface EventDetailResponse {
  id: string
  title: string
  description: string | null
  url_slug: string
  created_at: string
  expires_at: string
  candidate_dates: CandidateDate[]
  responses: ParticipantInfo[]
}

export interface ParticipantInfo {
  id: string
  participant_name: string
  created_at: string
}

export interface SummaryResponse {
  summary: SummaryItem[]
  participants: ParticipantSummary[]
}

export interface SummaryItem {
  date: string
  time: string
  count: number
}

export interface ParticipantSummary {
  name: string
  response_count: number
}

// ============================================
// エラー関連の型
// ============================================

export interface ApiError {
  error: string
}

// ============================================
// Store（Zustand）の型
// ============================================

export interface EventStore {
  title: string
  description: string
  candidateDates: CandidateDateInput[]
  setTitle: (title: string) => void
  setDescription: (description: string) => void
  addCandidateDate: (date: CandidateDateInput) => void
  removeCandidateDate: (index: number) => void
  updateCandidateDate: (index: number, updates: Partial<CandidateDateInput>) => void
  clearForm: () => void
}

export interface ResponseStore {
  participantName: string
  selectedSlots: TimeSlot[]
  setParticipantName: (name: string) => void
  toggleSlot: (slot: TimeSlot) => void
  addSlotRange: (slots: TimeSlot[]) => void
  removeSlotRange: (slots: TimeSlot[]) => void
  clearAllSlots: () => void
  isSlotSelected: (slot: TimeSlot) => boolean
  getAvailabilityBlocks: () => AvailabilityBlockInput[]
  loadFromResponse: (blocks: AvailabilityBlock[]) => void
  reset: () => void
}
