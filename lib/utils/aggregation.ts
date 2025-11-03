import { generateTimeSlots } from './timeSlotCalculator'
import type { CandidateDate, AvailabilityBlock } from '@/types'

export interface TimeSlotSummary {
  date: string
  time: string
  participantCount: number
  participantNames: string[]
}

export interface DateSummary {
  date: string
  slots: TimeSlotSummary[]
  maxCount: number
}

export interface AggregationResult {
  dateSummaries: DateSummary[]
  bestSlots: TimeSlotSummary[]
  totalParticipants: number
}

export interface ResponseWithBlocks {
  id: string
  participant_name: string
  availability_blocks: AvailabilityBlock[]
}

/**
 * 回答データを集計して30分単位の参加者数を計算
 */
export function calculateAggregation(
  candidateDates: CandidateDate[],
  responses: ResponseWithBlocks[]
): AggregationResult {
  const dateSummaries: DateSummary[] = []

  // 候補日ごとに集計
  for (const candidateDate of candidateDates) {
    const timeSlots = generateTimeSlots(
      candidateDate.start_time,
      candidateDate.end_time
    )

    const slots: TimeSlotSummary[] = timeSlots.map((time) => {
      // この時間帯に参加可能な人を集計
      const participants = responses.filter((response) => {
        return response.availability_blocks.some((block) => {
          // ブロックの日付が一致 && 時間帯がブロックの範囲内
          return (
            block.date === candidateDate.date &&
            block.start_time <= time &&
            block.end_time > time
          )
        })
      })

      return {
        date: candidateDate.date,
        time,
        participantCount: participants.length,
        participantNames: participants.map((p) => p.participant_name),
      }
    })

    const maxCount = Math.max(...slots.map((s) => s.participantCount), 0)

    dateSummaries.push({
      date: candidateDate.date,
      slots,
      maxCount,
    })
  }

  // 全体で最も参加者が多い時間帯を抽出
  const allSlots = dateSummaries.flatMap((d) => d.slots)
  const maxParticipantCount = Math.max(
    ...allSlots.map((s) => s.participantCount),
    0
  )
  const bestSlots = allSlots.filter(
    (s) => s.participantCount === maxParticipantCount && s.participantCount > 0
  )

  return {
    dateSummaries,
    bestSlots,
    totalParticipants: responses.length,
  }
}
