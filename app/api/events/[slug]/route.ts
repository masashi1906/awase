import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { isValidEvent } from '@/lib/utils/dateUtils'
import type { EventDetailResponse, EventFormData, ApiError } from '@/types'

/**
 * イベント詳細取得API
 * GET /api/events/[slug]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

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

/**
 * イベント更新API
 * PUT /api/events/[slug]
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const body: EventFormData & { event_edit_code: string } = await request.json()

    // バリデーション
    if (!body.event_edit_code || !body.title || !body.candidateDates || body.candidateDates.length === 0) {
      return NextResponse.json<ApiError>(
        { error: '編集コード、タイトル、候補日は必須です' },
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

    // イベントを取得して編集コードを検証
    const { data: event, error: fetchError } = await supabase
      .from('events')
      .select('id, event_edit_code')
      .eq('url_slug', slug)
      .single()

    if (fetchError || !event) {
      return NextResponse.json<ApiError>(
        { error: 'イベントが見つかりません' },
        { status: 404 }
      )
    }

    // 編集コード認証
    if (event.event_edit_code !== body.event_edit_code) {
      return NextResponse.json<ApiError>(
        { error: '編集コードが正しくありません' },
        { status: 401 }
      )
    }

    // イベント情報を更新
    const { error: updateError } = await supabase
      .from('events')
      .update({
        title: body.title,
        description: body.description || null,
      })
      .eq('id', event.id)

    if (updateError) {
      console.error('Event update error:', updateError)
      return NextResponse.json<ApiError>(
        { error: 'イベントの更新に失敗しました' },
        { status: 500 }
      )
    }

    // 既存の候補日を取得（削除される日付を特定）
    const { data: existingDates } = await supabase
      .from('candidate_dates')
      .select('date')
      .eq('event_id', event.id)

    // 削除される日付の availability_blocks を手動で削除
    // （candidate_date_id 列がないため CASCADE 削除されない）
    if (existingDates && existingDates.length > 0) {
      for (const dateRecord of existingDates) {
        await supabase
          .from('availability_blocks')
          .delete()
          .eq('date', dateRecord.date)
      }
    }

    // 既存の候補日を削除
    const { error: deleteDatesError } = await supabase
      .from('candidate_dates')
      .delete()
      .eq('event_id', event.id)

    if (deleteDatesError) {
      console.error('Candidate dates deletion error:', deleteDatesError)
      return NextResponse.json<ApiError>(
        { error: '候補日の削除に失敗しました' },
        { status: 500 }
      )
    }

    // 新しい候補日を挿入
    const { error: insertDatesError } = await supabase
      .from('candidate_dates')
      .insert(
        body.candidateDates.map((date) => ({
          event_id: event.id,
          date: date.date,
          start_time: date.start_time,
          end_time: date.end_time,
        }))
      )

    if (insertDatesError) {
      console.error('Candidate dates insertion error:', insertDatesError)
      return NextResponse.json<ApiError>(
        { error: '候補日の登録に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json<ApiError>(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}
