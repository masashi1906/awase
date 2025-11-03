import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { isValidEvent } from '@/lib/utils/dateUtils'
import type { ApiError } from '@/types'

/**
 * イベント集計データ取得API
 * GET /api/events/[slug]/result
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    // イベントと候補日を取得
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select(
        `
        id,
        title,
        description,
        expires_at,
        candidate_dates(*)
      `
      )
      .eq('url_slug', slug)
      .single()

    if (eventError || !event) {
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

    // 回答とavailability_blocksを取得
    const { data: responses, error: responsesError } = await supabase
      .from('responses')
      .select(
        `
        id,
        participant_name,
        created_at,
        availability_blocks(date, start_time, end_time)
      `
      )
      .eq('event_id', event.id)
      .order('created_at', { ascending: true })

    if (responsesError) {
      console.error('Failed to fetch responses:', responsesError)
      return NextResponse.json<ApiError>(
        { error: 'データの取得に失敗しました' },
        { status: 500 }
      )
    }

    // レスポンス整形
    const formattedResponses = (responses || []).map((response) => ({
      id: response.id,
      participant_name: response.participant_name,
      created_at: response.created_at,
      availability_blocks: (response.availability_blocks || []).sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date)
        return a.start_time.localeCompare(b.start_time)
      }),
    }))

    return NextResponse.json(
      {
        id: event.id,
        title: event.title,
        description: event.description,
        candidate_dates: sortedCandidateDates,
        responses: formattedResponses,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json<ApiError>(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}
