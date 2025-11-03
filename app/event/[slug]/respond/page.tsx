import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { ResponseForm } from '@/components/response/ResponseForm'
import type { EventDetailResponse } from '@/types'

interface PageProps {
  params: Promise<{ slug: string }>
}

// イベントデータを取得
async function getEvent(slug: string): Promise<EventDetailResponse | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const response = await fetch(
      `${baseUrl}/api/events/${slug}`,
      {
        cache: 'no-store', // 常に最新データを取得
      }
    )

    if (!response.ok) {
      return null
    }

    return response.json()
  } catch (error) {
    console.error('Failed to fetch event:', error)
    return null
  }
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const event = await getEvent(slug)

  if (!event) {
    return {
      title: 'イベントが見つかりません | Awase',
    }
  }

  return {
    title: `${event.title}に回答 | Awase`,
    description: `${event.title}の予定調整に回答する`,
  }
}

export default async function RespondPage({ params }: PageProps) {
  const { slug } = await params
  const event = await getEvent(slug)

  if (!event) {
    notFound()
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 戻るリンク */}
      <Link
        href={`/event/${slug}`}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        イベント詳細に戻る
      </Link>

      {/* ページタイトル */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">予定を入力</h1>
        <p className="text-lg text-muted-foreground">{event.title}</p>
        {event.description && (
          <p className="text-sm text-muted-foreground">{event.description}</p>
        )}
      </div>

      {/* 回答フォーム */}
      <ResponseForm eventSlug={slug} candidateDates={event.candidate_dates} />
    </div>
  )
}
