import { EventForm } from '@/components/event/EventForm'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  title: 'イベント作成 | Awase',
  description: 'スケジュール調整イベントを作成する',
}

/**
 * イベント作成ページ
 * タイトル、説明、候補日を入力してイベントを作成
 */
export default function CreatePage() {
  return (
    <div className="flex flex-col gap-6">
      {/* 戻るリンク */}
      <Link
        href="/"
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        トップページに戻る
      </Link>

      {/* ページタイトル */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">イベント作成</h1>
        <p className="text-muted-foreground">
          スケジュール調整したい候補日を追加してください
        </p>
      </div>

      {/* イベント作成フォーム */}
      <EventForm />
    </div>
  )
}
