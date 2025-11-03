import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Calendar, Users, Clock } from 'lucide-react'

export default function Home() {
  return (
    <div className="flex flex-col gap-16 py-8">
      {/* Hero Section */}
      <section className="flex flex-col items-center gap-8 text-center">
        <div className="flex flex-col gap-4">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            <span className="bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">
              スマホで簡単
            </span>
            <br />
            スケジュール調整
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            ドラッグ操作で空き時間を選択。ログイン不要で、すぐに使えるスケジュール調整アプリ
          </p>
        </div>

        <Link href="/create">
          <Button size="lg" className="text-lg px-8 py-6 h-auto">
            <Calendar className="mr-2 h-5 w-5" />
            イベントを作成
          </Button>
        </Link>
      </section>

      {/* How It Works Section */}
      <section className="flex flex-col gap-8">
        <h2 className="text-2xl font-bold text-center">使い方</h2>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6 flex flex-col items-center gap-4 text-center">
              <div className="rounded-full bg-primary-100 p-3">
                <Calendar className="h-8 w-8 text-primary-500" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">1. イベント作成</h3>
                <p className="text-sm text-muted-foreground">
                  候補日と時間範囲を設定して共有URLを発行
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 flex flex-col items-center gap-4 text-center">
              <div className="rounded-full bg-secondary-100 p-3">
                <Clock className="h-8 w-8 text-secondary-500" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">2. 空き時間を選択</h3>
                <p className="text-sm text-muted-foreground">
                  カレンダーをドラッグして参加可能な時間を選択
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 flex flex-col items-center gap-4 text-center">
              <div className="rounded-full bg-primary-100 p-3">
                <Users className="h-8 w-8 text-primary-500" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">3. 結果を確認</h3>
                <p className="text-sm text-muted-foreground">
                  参加可能人数を集計して最適な時間帯を提示
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features Section */}
      <section className="flex flex-col gap-6 bg-muted rounded-lg p-8">
        <h2 className="text-2xl font-bold text-center">主な特徴</h2>

        <ul className="grid gap-4 md:grid-cols-2 max-w-3xl mx-auto">
          <li className="flex items-center gap-3">
            <div className="h-6 w-6 rounded-full bg-primary-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm">✓</span>
            </div>
            <span>ログイン不要で即利用可能</span>
          </li>
          <li className="flex items-center gap-3">
            <div className="h-6 w-6 rounded-full bg-primary-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm">✓</span>
            </div>
            <span>スマホ最適化のドラッグUI</span>
          </li>
          <li className="flex items-center gap-3">
            <div className="h-6 w-6 rounded-full bg-primary-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm">✓</span>
            </div>
            <span>30分単位の細かい時間調整</span>
          </li>
          <li className="flex items-center gap-3">
            <div className="h-6 w-6 rounded-full bg-primary-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm">✓</span>
            </div>
            <span>編集コードで後から変更可能</span>
          </li>
        </ul>
      </section>

      {/* Final CTA */}
      <section className="flex flex-col items-center gap-6 text-center">
        <h2 className="text-2xl font-bold">今すぐ始める</h2>
        <p className="text-muted-foreground">
          アカウント登録不要。すぐにスケジュール調整を開始できます
        </p>
        <Link href="/create">
          <Button size="lg" variant="outline" className="text-lg px-8 py-6 h-auto">
            イベントを作成する
          </Button>
        </Link>
      </section>
    </div>
  )
}
