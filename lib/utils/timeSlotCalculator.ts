/**
 * 時間スロット計算ユーティリティ
 * 30分単位での時間計算を行う
 */

export interface TimeSlot {
  date: string // "2025-11-05"
  time: string // "10:00"
}

export interface AvailabilityBlock {
  date: string
  start_time: string
  end_time: string
}

/**
 * 時刻に分を加算
 * @param time - "HH:mm" 形式の時刻
 * @param minutes - 加算する分数
 * @returns "HH:mm" 形式の時刻
 */
export function addMinutes(time: string, minutes: number): string {
  const [hours, mins] = time.split(':').map(Number)
  const totalMinutes = hours * 60 + mins + minutes
  const newHours = Math.floor(totalMinutes / 60)
  const newMins = totalMinutes % 60
  return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`
}

/**
 * 開始時刻と終了時刻から30分単位のスロットを生成
 * @param startTime - 開始時刻 ("09:00")
 * @param endTime - 終了時刻 ("18:00")
 * @returns 30分単位のスロット配列 ["09:00", "09:30", "10:00", ...]
 */
export function generateTimeSlots(
  startTime: string,
  endTime: string
): string[] {
  const slots: string[] = []
  let current = startTime

  while (current < endTime) {
    slots.push(current)
    current = addMinutes(current, 30)
  }

  return slots
}

/**
 * 連続する時間スロットを結合してAvailabilityBlocksに変換
 * @param slots - TimeSlot配列
 * @returns AvailabilityBlock配列
 *
 * 例:
 * Input: [
 *   { date: "2025-11-05", time: "10:00" },
 *   { date: "2025-11-05", time: "10:30" },
 *   { date: "2025-11-05", time: "11:00" }
 * ]
 * Output: [
 *   { date: "2025-11-05", start_time: "10:00", end_time: "11:30" }
 * ]
 */
export function mergeConsecutiveSlots(
  slots: TimeSlot[]
): AvailabilityBlock[] {
  if (slots.length === 0) return []

  // 日付でグループ化
  const byDate = slots.reduce((acc, slot) => {
    if (!acc[slot.date]) {
      acc[slot.date] = []
    }
    acc[slot.date].push(slot)
    return acc
  }, {} as Record<string, TimeSlot[]>)

  const blocks: AvailabilityBlock[] = []

  for (const [date, dateSlots] of Object.entries(byDate)) {
    // 時間でソート
    const sorted = [...dateSlots].sort((a, b) =>
      a.time.localeCompare(b.time)
    )

    // 連続する時間を結合
    let currentBlock: AvailabilityBlock | null = null

    for (const slot of sorted) {
      if (!currentBlock) {
        // 新しいブロック開始
        currentBlock = {
          date,
          start_time: slot.time,
          end_time: addMinutes(slot.time, 30)
        }
      } else if (currentBlock.end_time === slot.time) {
        // 連続している → 終了時刻を延長
        currentBlock.end_time = addMinutes(slot.time, 30)
      } else {
        // 連続していない → 現在のブロックを保存して新しいブロック開始
        blocks.push(currentBlock)
        currentBlock = {
          date,
          start_time: slot.time,
          end_time: addMinutes(slot.time, 30)
        }
      }
    }

    // 最後のブロックを保存
    if (currentBlock) {
      blocks.push(currentBlock)
    }
  }

  return blocks
}

/**
 * AvailabilityBlocksを30分単位のTimeSlotsに展開
 * @param blocks - AvailabilityBlock配列
 * @returns TimeSlot配列
 *
 * 例:
 * Input: [
 *   { date: "2025-11-05", start_time: "10:00", end_time: "11:30" }
 * ]
 * Output: [
 *   { date: "2025-11-05", time: "10:00" },
 *   { date: "2025-11-05", time: "10:30" },
 *   { date: "2025-11-05", time: "11:00" }
 * ]
 */
export function expandBlocksToSlots(
  blocks: AvailabilityBlock[]
): TimeSlot[] {
  const slots: TimeSlot[] = []

  for (const block of blocks) {
    const timeSlots = generateTimeSlots(block.start_time, block.end_time)
    for (const time of timeSlots) {
      slots.push({
        date: block.date,
        time
      })
    }
  }

  return slots
}

/**
 * 指定した時間スロットが利用可能かチェック
 * @param slot - チェックするスロット
 * @param blocks - AvailabilityBlock配列
 * @returns true: 利用可能、false: 利用不可
 */
export function isSlotAvailable(
  slot: TimeSlot,
  blocks: AvailabilityBlock[]
): boolean {
  return blocks.some(block =>
    block.date === slot.date &&
    block.start_time <= slot.time &&
    block.end_time > slot.time
  )
}
