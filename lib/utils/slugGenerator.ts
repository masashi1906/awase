/**
 * ランダムなURL slugを生成
 * @param length - 生成する文字列の長さ（デフォルト: 10）
 * @returns ランダムな英数字文字列（例: "a3k9x2m7b1"）
 */
export function generateSlug(length: number = 10): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let slug = ''

  for (let i = 0; i < length; i++) {
    slug += chars[Math.floor(Math.random() * chars.length)]
  }

  return slug
}

/**
 * 4桁の編集コードを生成
 * @returns 4桁の数字文字列（例: "1234"）
 */
export function generateEditCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString()
}
