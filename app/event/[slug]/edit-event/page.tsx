'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react'
import { CandidateDateForm } from '@/components/event/CandidateDateForm'
import { CandidateDateList } from '@/components/event/CandidateDateList'
import { useEventStore } from '@/lib/store/eventStore'
import type { EventDetailResponse } from '@/types'

interface PageProps {
  params: Promise<{ slug: string }>
}

type ViewState = 'auth' | 'loading' | 'success' | 'error' | 'form'

export default function EventEditPage({ params }: PageProps) {
  const router = useRouter()
  const [slug, setSlug] = useState<string>('')
  const [viewState, setViewState] = useState<ViewState>('auth')
  const [editCode, setEditCode] = useState('')
  const [error, setError] = useState('')
  const [event, setEvent] = useState<EventDetailResponse | null>(null)

  const {
    title,
    description,
    candidateDates,
    setTitle,
    setDescription,
    addCandidateDate,
    removeCandidateDate,
    clearForm,
  } = useEventStore()

  useEffect(() => {
    params.then((p) => {
      setSlug(p.slug)
      // イベント情報を取得
      fetchEvent(p.slug)
    })
  }, [params])

  const fetchEvent = async (eventSlug: string) => {
    try {
      const res = await fetch(`/api/events/${eventSlug}`)
      if (res.ok) {
        const data: EventDetailResponse = await res.json()
        setEvent(data)
      }
    } catch (err) {
      console.error('Failed to fetch event:', err)
    }
  }

  const handleAuth = async () => {
    setError('')

    if (!editCode.trim()) {
      setError('編集コードを入力してください')
      return
    }

    if (editCode.length !== 8) {
      setError('編集コードは8桁です')
      return
    }

    setViewState('loading')

    try {
      // 1. 編集コードで認証
      const authRes = await fetch(`/api/events/${slug}/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_edit_code: editCode }),
      })

      if (!authRes.ok) {
        const data = await authRes.json()
        throw new Error(data.error || '認証に失敗しました')
      }

      // 2. 認証成功 - イベント情報を取得
      const eventRes = await fetch(`/api/events/${slug}`)
      if (!eventRes.ok) {
        throw new Error('イベント情報の取得に失敗しました')
      }

      const eventData: EventDetailResponse = await eventRes.json()

      setViewState('success')

      // 1.5秒後にフォーム画面へ
      setTimeout(() => {
        // ストアにイベント情報を読み込む
        clearForm() // 先にクリア
        setTitle(eventData.title) // その後にタイトルをセット
        setDescription(eventData.description || '') // 説明をセット
        eventData.candidate_dates.forEach((date) => {
          addCandidateDate({
            date: date.date,
            start_time: date.start_time,
            end_time: date.end_time,
          })
        })
        setViewState('form')
      }, 1500)
    } catch (err) {
      setViewState('error')
      setError(err instanceof Error ? err.message : '認証に失敗しました')
    }
  }

  const handleUpdate = async () => {
    if (!title.trim()) {
      alert('タイトルを入力してください')
      return
    }

    if (candidateDates.length === 0) {
      alert('候補日を1つ以上追加してください')
      return
    }

    try {
      const res = await fetch(`/api/events/${slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_edit_code: editCode,
          title,
          description,
          candidateDates,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || '更新に失敗しました')
      }

      alert('イベントを更新しました')
      router.push(`/event/${slug}`)
    } catch (err) {
      alert(err instanceof Error ? err.message : '更新に失敗しました')
    }
  }

  // 認証画面
  if (viewState === 'auth' || viewState === 'error') {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* ヘッダー */}
        <div className="bg-white border-b border-gray-200 px-5 py-5">
          <button
            onClick={() => router.push(`/event/${slug}`)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-2"
          >
            <ArrowLeft className="w-5 h-5" />
            戻る
          </button>
          <h1 className="text-xl font-bold text-gray-900">イベントを編集</h1>
          <p className={`text-sm mt-1 ${viewState === 'error' ? 'text-red-600' : 'text-gray-600'}`}>
            {viewState === 'error' ? '認証に失敗しました' : '編集コードを入力してください'}
          </p>
        </div>

        {/* フォーム */}
        <div className="px-6 py-6 space-y-6">
          {/* イベント情報カード */}
          {event && (
            <Card>
              <CardContent className="pt-6">
                <h2 className="font-semibold text-gray-900 mb-1">{event.title}</h2>
                <p className="text-sm text-gray-600">
                  候補日: {event.candidate_dates.length}件
                </p>
              </CardContent>
            </Card>
          )}

          {/* エラーアラート */}
          {viewState === 'error' && error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-red-900">{error}</p>
                    <p className="text-sm text-red-700 mt-1">
                      入力内容を確認して、もう一度お試しください
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 認証フォーム */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div>
                <label htmlFor="editCode" className="block text-sm font-semibold text-gray-700 mb-2">
                  編集コード
                </label>
                <Input
                  id="editCode"
                  type="text"
                  value={editCode}
                  onChange={(e) => setEditCode(e.target.value.toLowerCase())}
                  placeholder="8桁の英数字"
                  maxLength={8}
                  className="font-mono"
                />
                <p className="text-xs text-gray-600 mt-2">
                  イベント作成時に発行された8桁のコードを入力してください
                </p>
              </div>

              <Button
                onClick={handleAuth}
                className="w-full bg-red-500 hover:bg-red-600"
                disabled={!editCode.trim()}
              >
                編集画面へ
              </Button>
            </CardContent>
          </Card>

          {/* 注意事項 */}
          <Card className="bg-amber-50">
            <CardContent className="pt-6">
              <h3 className="font-semibold text-amber-900 mb-2">⚠️ 注意事項</h3>
              <ul className="text-sm text-amber-800 space-y-1">
                <li>• 編集コードはイベント作成時に発行されたものです</li>
                <li>• 候補日を削除すると、その日への参加者の回答も削除されます</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // 認証成功（ローディング）
  if (viewState === 'success' || viewState === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200 px-5 py-5">
          <h1 className="text-xl font-bold text-green-600">認証成功</h1>
          <p className="text-sm text-gray-600 mt-1">編集画面に移動しています...</p>
        </div>

        <div className="flex flex-col items-center justify-center py-20 px-6">
          <CheckCircle2 className="w-16 h-16 text-green-600 mb-6" />
          <Loader2 className="w-8 h-8 animate-spin text-gray-400 mb-4" />
          <p className="text-gray-600 mb-2">イベント情報を読み込んでいます...</p>
        </div>
      </div>
    )
  }

  // 編集フォーム
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-white border-b border-gray-200 px-5 py-5">
        <button
          onClick={() => router.push(`/event/${slug}`)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-2"
        >
          <ArrowLeft className="w-5 h-5" />
          戻る
        </button>
        <h1 className="text-xl font-bold text-gray-900">イベントを編集</h1>
        <p className="text-sm text-gray-600 mt-1">イベント情報を変更できます</p>
      </div>

      {/* フォーム */}
      <div className="px-5 py-6 space-y-6">
        {/* 基本情報 */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-2">
                イベントタイトル <span className="text-red-500">*</span>
              </label>
              <Input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例: 新年会の日程調整"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
                説明（任意）
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="例: 1月の新年会について、皆さんの都合の良い日を教えてください"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </CardContent>
        </Card>

        {/* 候補日 */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <h2 className="text-base font-semibold text-gray-900">候補日</h2>
            <CandidateDateList
              candidateDates={candidateDates}
              onRemove={removeCandidateDate}
            />
          </CardContent>
        </Card>

        {/* 候補日追加フォーム */}
        <CandidateDateForm onAdd={addCandidateDate} />

        {/* 更新ボタン */}
        <div className="space-y-3 bg-white border-t border-gray-200 px-5 py-5">
          <Button
            onClick={handleUpdate}
            className="w-full bg-red-500 hover:bg-red-600"
            disabled={!title.trim() || candidateDates.length === 0}
          >
            更新する
          </Button>
          <p className="text-xs text-gray-600 text-center">
            ⚠️ 候補日を削除すると、その日への参加者の回答も削除されます
          </p>
        </div>
      </div>
    </div>
  )
}
