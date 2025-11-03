import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { SummaryView } from '@/components/result/SummaryView'
import { ParticipantList } from '@/components/event/ParticipantList'
import { calculateAggregation } from '@/lib/utils/aggregation'
import type { CandidateDate, AvailabilityBlock } from '@/types'

interface PageProps {
  params: Promise<{ slug: string }>
}

interface EventWithResponses {
  id: string
  title: string
  description: string | null
  candidate_dates: CandidateDate[]
  responses: Array<{
    id: string
    participant_name: string
    created_at: string
    availability_blocks: AvailabilityBlock[]
  }>
}

// イベントデータと回答を取得
async function getEventWithResponses(
  slug: string
): Promise<EventWithResponses | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}/api/events/${slug}/result`, {
      cache: 'no-store', // 常に最新データを取得
    })

    if (!response.ok) {
      return null
    }

    return response.json()
  } catch (error) {
    console.error('Failed to fetch event with responses:', error)
    return null
  }
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const event = await getEventWithResponses(slug)

  if (!event) {
    return {
      title: 'イベントが見つかりません | Awase',
    }
  }

  return {
    title: `${event.title}の集計結果 | Awase`,
    description: `${event.title}の予定調整の集計結果を表示`,
  }
}

export default async function ResultPage({ params }: PageProps) {
  const { slug } = await params
  const event = await getEventWithResponses(slug)

  if (!event) {
    notFound()
  }

  // 集計処理
  const aggregation = calculateAggregation(
    event.candidate_dates,
    event.responses
  )

  // ParticipantList用のデータ整形
  const participants = event.responses.map((r) => ({
    id: r.id,
    participant_name: r.participant_name,
    created_at: r.created_at,
  }))

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
        <h1 className="text-3xl font-bold">集計結果</h1>
        <p className="text-lg text-muted-foreground">{event.title}</p>
        {event.description && (
          <p className="text-sm text-muted-foreground">{event.description}</p>
        )}
      </div>

      {/* 参加者一覧 */}
      <ParticipantList participants={participants} />

      {/* 集計結果 */}
      <SummaryView aggregation={aggregation} />
    </div>
  )
}
