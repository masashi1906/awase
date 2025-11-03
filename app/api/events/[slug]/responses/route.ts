import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { generateSlug } from '@/lib/utils/slugGenerator'
import type { ApiError, AvailabilityBlockInput } from '@/types'

interface ResponseRequestBody {
  participant_name: string
  availability_blocks: AvailabilityBlockInput[]
}

/**
 * 回答投稿API
 * POST /api/events/[slug]/responses
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const body: ResponseRequestBody = await request.json()

    // バリデーション
    if (!body.participant_name?.trim()) {
      return NextResponse.json<ApiError>(
        { error: '名前を入力してください' },
        { status: 400 }
      )
    }

    if (!body.availability_blocks?.length) {
      return NextResponse.json<ApiError>(
        { error: '少なくとも1つの時間帯を選択してください' },
        { status: 400 }
      )
    }

    // イベントを取得
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id')
      .eq('url_slug', slug)
      .single()

    if (eventError || !event) {
      return NextResponse.json<ApiError>(
        { error: 'イベントが見つかりません' },
        { status: 404 }
      )
    }

    // edit_code を生成（8文字）
    const editCode = generateSlug().slice(0, 8)

    // 回答を作成
    const { data: response, error: responseError } = await supabase
      .from('responses')
      .insert({
        event_id: event.id,
        participant_name: body.participant_name.trim(),
        edit_code: editCode,
      })
      .select()
      .single()

    if (responseError || !response) {
      console.error('Failed to create response:', responseError)
      return NextResponse.json<ApiError>(
        { error: '回答の保存に失敗しました' },
        { status: 500 }
      )
    }

    // availability_blocks をブロック単位で保存
    if (body.availability_blocks.length > 0) {
      const blocksToInsert = body.availability_blocks.map((block) => ({
        response_id: response.id,
        date: block.date,
        start_time: block.start_time,
        end_time: block.end_time,
      }))

      const { error: blocksError } = await supabase
        .from('availability_blocks')
        .insert(blocksToInsert)

      if (blocksError) {
        console.error('Failed to create availability blocks:', blocksError)
        // ロールバック: 回答を削除
        await supabase.from('responses').delete().eq('id', response.id)

        return NextResponse.json<ApiError>(
          { error: '予定の保存に失敗しました' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json(
      {
        id: response.id,
        participant_name: response.participant_name,
        created_at: response.created_at,
        edit_code: editCode,
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
