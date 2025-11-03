import { format, parse, addMonths, isAfter, isBefore, parseISO } from 'date-fns'
import { ja } from 'date-fns/locale'

/**
 * 日付を "M/d (曜日)" 形式でフォーマット
 * @param date - Date オブジェクトまたは ISO 文字列
 * @returns "11/5 (火)" のような形式
 */
export function formatDateWithDay(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return format(dateObj, 'M/d (E)', { locale: ja })
}

/**
 * 日付を "yyyy-MM-dd" 形式でフォーマット（DB用）
 * @param date - Date オブジェクト
 * @returns "2025-11-05" のような形式
 */
export function formatDateForDB(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

/**
 * 時刻を "HH:mm" 形式でフォーマット
 * @param date - Date オブジェクト
 * @returns "14:30" のような形式
 */
export function formatTime(date: Date): string {
  return format(date, 'HH:mm')
}

/**
 * 日付文字列を Date オブジェクトに変換
 * @param dateString - "yyyy-MM-dd" 形式の文字列
 * @returns Date オブジェクト
 */
export function parseDateString(dateString: string): Date {
  return parse(dateString, 'yyyy-MM-dd', new Date())
}

/**
 * 時刻文字列を Date オブジェクトに変換
 * @param timeString - "HH:mm" 形式の文字列
 * @returns Date オブジェクト（今日の日付で）
 */
export function parseTimeString(timeString: string): Date {
  return parse(timeString, 'HH:mm', new Date())
}

/**
 * 現在日時から1ヶ月後の日時を取得
 * @returns 1ヶ月後の Date オブジェクト
 */
export function getExpiryDate(): Date {
  return addMonths(new Date(), 1)
}

/**
 * 日付が有効期限内かチェック
 * @param expiresAt - 有効期限の ISO 文字列
 * @returns true: 有効期限内、false: 期限切れ
 */
export function isValidEvent(expiresAt: string): boolean {
  const expiryDate = parseISO(expiresAt)
  return isAfter(expiryDate, new Date())
}

/**
 * 日付が過去かチェック
 * @param date - チェックする日付
 * @returns true: 過去、false: 未来または今日
 */
export function isPastDate(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return isBefore(dateObj, today)
}

/**
 * 相対的な日時を表示（例: "2時間前", "3日前"）
 * @param date - Date オブジェクトまたは ISO 文字列
 * @returns "○時間前" のような文字列
 */
export function formatRelativeTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  const now = new Date()
  const diffMs = now.getTime() - dateObj.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 60) {
    return `${diffMins}分前`
  } else if (diffHours < 24) {
    return `${diffHours}時間前`
  } else if (diffDays < 7) {
    return `${diffDays}日前`
  } else {
    return format(dateObj, 'M/d', { locale: ja })
  }
}
