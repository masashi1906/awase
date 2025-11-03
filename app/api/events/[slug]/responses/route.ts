import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { generateSlug } from '@/lib/utils/slugGenerator'
import type { ApiError, AvailabilityBlockInput } from '@/types'

interface ResponseRequestBody {
  participant_name: string
  availability_blocks: AvailabilityBlockInput[]
}

interface UpdateRequestBody {
  response_id: string
  participant_name: string
  edit_code: string
  availability_blocks: AvailabilityBlockInput[]
}

/**
 * 回答認証API
 * GET /api/events/[slug]/responses?name=xxx&code=xxx
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const { searchParams } = new URL(request.url)
    const participantName = searchParams.get('name')
    const editCode = searchParams.get('code')

    // バリデーション
    if (!participantName || !editCode) {
      return NextResponse.json<ApiError>(
        { error: '名前と編集コードを指定してください' },
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

    // 回答を認証
    const { data: response, error: responseError } = await supabase
      .from('responses')
      .select('id, participant_name, edit_code, created_at')
      .eq('event_id', event.id)
      .eq('participant_name', participantName)
      .eq('edit_code', editCode)
      .single()

    if (responseError || !response) {
      return NextResponse.json<ApiError>(
        { error: '名前または編集コードが間違っています' },
        { status: 401 }
      )
    }

    // 既存の availability_blocks を取得
    const { data: blocks, error: blocksError } = await supabase
      .from('availability_blocks')
      .select('date, start_time, end_time')
      .eq('response_id', response.id)
      .order('date', { ascending: true })
      .order('start_time', { ascending: true })

    if (blocksError) {
      console.error('Failed to fetch availability blocks:', blocksError)
      return NextResponse.json<ApiError>(
        { error: 'データの取得に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        id: response.id,
        participant_name: response.participant_name,
        created_at: response.created_at,
        availability_blocks: blocks || [],
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

/**
 * 回答更新API
 * PUT /api/events/[slug]/responses
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const body: UpdateRequestBody = await request.json()

    // バリデーション
    if (!body.response_id || !body.participant_name?.trim() || !body.edit_code?.trim()) {
      return NextResponse.json<ApiError>(
        { error: '必須パラメータが不足しています' },
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

    // 回答を認証
    const { data: response, error: responseError } = await supabase
      .from('responses')
      .select('id')
      .eq('id', body.response_id)
      .eq('event_id', event.id)
      .eq('participant_name', body.participant_name.trim())
      .eq('edit_code', body.edit_code.trim())
      .single()

    if (responseError || !response) {
      return NextResponse.json<ApiError>(
        { error: '認証に失敗しました' },
        { status: 401 }
      )
    }

    // 既存の availability_blocks を削除
    const { error: deleteError } = await supabase
      .from('availability_blocks')
      .delete()
      .eq('response_id', response.id)

    if (deleteError) {
      console.error('Failed to delete availability blocks:', deleteError)
      return NextResponse.json<ApiError>(
        { error: 'データの削除に失敗しました' },
        { status: 500 }
      )
    }

    // 新しい availability_blocks を挿入
    if (body.availability_blocks.length > 0) {
      const blocksToInsert = body.availability_blocks.map((block) => ({
        response_id: response.id,
        date: block.date,
        start_time: block.start_time,
        end_time: block.end_time,
      }))

      const { error: insertError } = await supabase
        .from('availability_blocks')
        .insert(blocksToInsert)

      if (insertError) {
        console.error('Failed to insert availability blocks:', insertError)
        return NextResponse.json<ApiError>(
          { error: '予定の更新に失敗しました' },
          { status: 500 }
        )
      }
    }

    // updated_at を更新
    const { error: updateError } = await supabase
      .from('responses')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', response.id)

    if (updateError) {
      console.error('Failed to update timestamp:', updateError)
    }

    return NextResponse.json(
      {
        id: response.id,
        participant_name: body.participant_name.trim(),
        message: '回答を更新しました',
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
