import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils/dateUtils'
import type { ParticipantInfo } from '@/types'

interface ParticipantListProps {
  participants: ParticipantInfo[]
}

/**
 * 参加者一覧コンポーネント
 * イベントに回答した参加者を表示
 */
export function ParticipantList({ participants }: ParticipantListProps) {
  if (participants.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            参加者（0人）
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            まだ回答がありません
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          参加者（{participants.length}人）
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col gap-2">
          {participants.map((participant) => (
            <li
              key={participant.id}
              className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent transition-colors"
            >
              <span className="font-medium">{participant.participant_name}</span>
              <span className="text-sm text-muted-foreground">
                {formatRelativeTime(participant.created_at)}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
