import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { generateSlug } from '@/lib/utils/slugGenerator'
import { getExpiryDate } from '@/lib/utils/dateUtils'
import type { EventFormData, CreateEventResponse, ApiError } from '@/types'

/**
 * イベント作成API
 * POST /api/events
 */
export async function POST(request: NextRequest) {
  try {
    const body: EventFormData = await request.json()

    // バリデーション
    if (!body.title || !body.candidateDates || body.candidateDates.length === 0) {
      return NextResponse.json<ApiError>(
        { error: 'タイトルと候補日は必須です' },
        { status: 400 }
      )
    }

    // 候補日の時間バリデーション
    for (const date of body.candidateDates) {
      if (date.start_time >= date.end_time) {
        return NextResponse.json<ApiError>(
          { error: '開始時刻は終了時刻より前にしてください' },
          { status: 400 }
        )
      }
    }

    // URL slug生成（ユニークになるまでリトライ）
    let slug = generateSlug()
    let isUnique = false
    let retryCount = 0
    const MAX_RETRIES = 10

    while (!isUnique && retryCount < MAX_RETRIES) {
      const { data } = await supabase
        .from('events')
        .select('id')
        .eq('url_slug', slug)
        .single()

      if (!data) {
        isUnique = true
      } else {
        slug = generateSlug()
        retryCount++
      }
    }

    if (!isUnique) {
      return NextResponse.json<ApiError>(
        { error: 'URL生成に失敗しました。もう一度お試しください' },
        { status: 500 }
      )
    }

    // イベント作成
    const expiresAt = getExpiryDate() // 1ヶ月後

    const { data: event, error: eventError } = await supabase
      .from('events')
      .insert({
        title: body.title,
        description: body.description || null,
        url_slug: slug,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single()

    if (eventError) {
      console.error('Event creation error:', eventError)
      return NextResponse.json<ApiError>(
        { error: 'イベントの作成に失敗しました' },
        { status: 500 }
      )
    }

    // 候補日を一括挿入
    const { error: datesError } = await supabase
      .from('candidate_dates')
      .insert(
        body.candidateDates.map((date) => ({
          event_id: event.id,
          date: date.date,
          start_time: date.start_time,
          end_time: date.end_time,
        }))
      )

    if (datesError) {
      console.error('Candidate dates insertion error:', datesError)
      // イベントは作成されているが候補日の挿入に失敗した場合、イベントを削除
      await supabase.from('events').delete().eq('id', event.id)

      return NextResponse.json<ApiError>(
        { error: '候補日の登録に失敗しました' },
        { status: 500 }
      )
    }

    // 成功レスポンス
    return NextResponse.json<CreateEventResponse>(
      {
        slug,
        url: `/event/${slug}`,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json<ApiError>(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}
