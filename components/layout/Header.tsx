import Link from 'next/link'
import Image from 'next/image'

/**
 * ヘッダーコンポーネント
 * 全ページで共通して使用されるヘッダー
 */
export function Header() {
  return (
    <header className="border-b border-border bg-card">
      <div className="max-w-4xl mx-auto px-4 py-4">
        <Link href="/" className="inline-block hover:opacity-80 transition-opacity">
          <Image
            src="/logo.svg"
            alt="Awase"
            width={120}
            height={40}
            priority
          />
        </Link>
      </div>
    </header>
  )
}
