import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Crown, Users } from 'lucide-react'
import { formatDateWithDay } from '@/lib/utils/dateUtils'
import type { AggregationResult } from '@/lib/utils/aggregation'

interface SummaryViewProps {
  aggregation: AggregationResult
}

/**
 * 集計結果表示コンポーネント
 * 30分単位の参加者数をヒートマップ風に表示
 */
export function SummaryView({ aggregation }: SummaryViewProps) {
  const { dateSummaries, bestSlots, totalParticipants } = aggregation

  if (totalParticipants === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">
            まだ回答がありません
          </p>
        </CardContent>
      </Card>
    )
  }

  // 参加者数に応じた色を返す
  const getColorClass = (count: number, maxCount: number) => {
    if (count === 0) return 'bg-gray-100 text-gray-400'
    const ratio = count / Math.max(maxCount, 1)
    if (ratio >= 0.8) return 'bg-primary text-white font-semibold'
    if (ratio >= 0.6) return 'bg-primary/70 text-white'
    if (ratio >= 0.4) return 'bg-primary/50 text-white'
    if (ratio >= 0.2) return 'bg-primary/30'
    return 'bg-primary/10'
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 最適な時間帯 */}
      {bestSlots.length > 0 && (
        <Card className="border-primary bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Crown className="h-5 w-5" />
              最適な時間帯
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <p className="text-sm text-muted-foreground mb-2">
                {bestSlots[0].participantCount}人が参加可能
              </p>
              <div className="grid gap-2">
                {bestSlots.map((slot, index) => (
                  <div
                    key={`${slot.date}_${slot.time}_${index}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-white border border-primary"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {formatDateWithDay(slot.date)}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {slot.time} 〜
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      <span className="font-semibold text-primary">
                        {slot.participantCount}人
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 日付ごとの集計 */}
      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">時間帯別の参加可能人数</h2>
        <p className="text-sm text-muted-foreground">
          色が濃いほど多くの人が参加可能です
        </p>

        {dateSummaries.map((dateSummary) => (
          <Card key={dateSummary.date}>
            <CardHeader>
              <CardTitle className="text-base">
                {formatDateWithDay(dateSummary.date)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {dateSummary.slots.map((slot) => (
                  <div
                    key={`${slot.date}_${slot.time}`}
                    className={`
                      p-3 rounded-lg transition-all cursor-pointer
                      hover:ring-2 hover:ring-primary hover:ring-offset-1
                      ${getColorClass(slot.participantCount, dateSummary.maxCount)}
                    `}
                    title={
                      slot.participantCount > 0
                        ? `参加者: ${slot.participantNames.join(', ')}`
                        : '参加者なし'
                    }
                  >
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-xs font-medium">{slot.time}</span>
                      <span className="text-sm font-semibold">
                        {slot.participantCount}人
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* 参加者名一覧（その日に回答がある場合のみ） */}
              {dateSummary.maxCount > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs text-muted-foreground">
                    この日に参加可能な人: {' '}
                    {Array.from(
                      new Set(
                        dateSummary.slots
                          .filter((s) => s.participantCount > 0)
                          .flatMap((s) => s.participantNames)
                      )
                    ).join(', ')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
