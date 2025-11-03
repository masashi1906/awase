import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { isValidEvent } from '@/lib/utils/dateUtils'
import type { EventDetailResponse, ApiError } from '@/types'

/**
 * イベント詳細取得API
 * GET /api/events/[slug]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params

    // イベントと関連データを取得
    const { data: event, error } = await supabase
      .from('events')
      .select(`
        *,
        candidate_dates(*),
        responses(
          id,
          participant_name,
          created_at
        )
      `)
      .eq('url_slug', slug)
      .single()

    if (error || !event) {
      return NextResponse.json<ApiError>(
        { error: 'イベントが見つかりません' },
        { status: 404 }
      )
    }

    // 有効期限チェック
    if (!isValidEvent(event.expires_at)) {
      return NextResponse.json<ApiError>(
        { error: 'このイベントは有効期限切れです' },
        { status: 410 }
      )
    }

    // 候補日を日付でソート
    const sortedCandidateDates = event.candidate_dates.sort((a, b) =>
      a.date.localeCompare(b.date)
    )

    // レスポンスを作成日時でソート
    const sortedResponses = event.responses.sort((a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )

    // レスポンス整形
    const response: EventDetailResponse = {
      id: event.id,
      title: event.title,
      description: event.description,
      url_slug: event.url_slug,
      created_at: event.created_at,
      expires_at: event.expires_at,
      candidate_dates: sortedCandidateDates,
      responses: sortedResponses,
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json<ApiError>(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}
