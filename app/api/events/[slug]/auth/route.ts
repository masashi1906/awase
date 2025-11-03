import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import type { ApiError } from '@/types'

/**
 * イベント編集コード認証API
 * POST /api/events/[slug]/auth
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const body = await request.json()
    const { event_edit_code } = body

    // バリデーション
    if (!event_edit_code) {
      return NextResponse.json<ApiError>(
        { error: '編集コードを入力してください' },
        { status: 400 }
      )
    }

    if (event_edit_code.length !== 8) {
      return NextResponse.json<ApiError>(
        { error: '編集コードは8桁です' },
        { status: 400 }
      )
    }

    // イベントを取得して編集コードを検証
    const { data: event, error } = await supabase
      .from('events')
      .select('id, title')
      .eq('url_slug', slug)
      .eq('event_edit_code', event_edit_code)
      .single()

    if (error || !event) {
      return NextResponse.json<ApiError>(
        { error: '編集コードが正しくありません' },
        { status: 401 }
      )
    }

    // 認証成功
    return NextResponse.json(
      {
        authenticated: true,
        event_id: event.id,
        event_title: event.title,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Authentication error:', error)
    return NextResponse.json<ApiError>(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}
