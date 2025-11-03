import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ParticipantList } from '@/components/event/ParticipantList'
import { ShareUrlButton } from '@/components/event/ShareUrlButton'
import { Calendar, Edit, BarChart3, ArrowLeft } from 'lucide-react'
import { formatDateWithDay } from '@/lib/utils/dateUtils'
import type { EventDetailResponse } from '@/types'

interface PageProps {
  params: { slug: string }
}

// イベントデータを取得
async function getEvent(slug: string): Promise<EventDetailResponse | null> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL ? 'http://localhost:3001' : ''}/api/events/${slug}`,
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
  const event = await getEvent(params.slug)

  if (!event) {
    return {
      title: 'イベントが見つかりません | Awase',
    }
  }

  return {
    title: `${event.title} | Awase`,
    description: event.description || 'スケジュール調整イベント',
  }
}

export default async function EventDetailPage({ params }: PageProps) {
  const event = await getEvent(params.slug)

  if (!event) {
    notFound()
  }

  // URLをコピーする関数（クライアントコンポーネントで実装）
  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/event/${params.slug}`

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

      {/* イベント情報 */}
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold">{event.title}</h1>
        {event.description && (
          <p className="text-muted-foreground">{event.description}</p>
        )}
      </div>

      {/* 共有URL */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-3">
            <label className="text-sm font-medium">共有URL</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 px-3 py-2 text-sm border rounded-lg bg-muted"
              />
              <ShareUrlButton url={shareUrl} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 候補日 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            候補日
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-col gap-2">
            {event.candidate_dates.map((date) => (
              <li
                key={date.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card"
              >
                <span className="font-medium">
                  {formatDateWithDay(date.date)}
                </span>
                <span className="text-sm text-muted-foreground">
                  {date.start_time} 〜 {date.end_time}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* 参加者一覧 */}
      <ParticipantList participants={event.responses} />

      {/* アクションボタン */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Link href={`/event/${params.slug}/respond`} className="w-full">
          <Button size="lg" className="w-full">
            <Calendar className="mr-2 h-5 w-5" />
            回答する
          </Button>
        </Link>

        <Link href={`/event/${params.slug}/edit`} className="w-full">
          <Button size="lg" variant="outline" className="w-full">
            <Edit className="mr-2 h-5 w-5" />
            編集する
          </Button>
        </Link>

        <Link href={`/event/${params.slug}/result`} className="w-full">
          <Button size="lg" variant="outline" className="w-full">
            <BarChart3 className="mr-2 h-5 w-5" />
            結果を見る
          </Button>
        </Link>
      </div>
    </div>
  )
}
