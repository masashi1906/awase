# Awase - スケジュール調整アプリ 要件定義書

## 目次
1. [プロジェクト概要](#プロジェクト概要)
2. [技術スタック](#技術スタック)
3. [データモデル設計](#データモデル設計)
4. [画面遷移・URL設計](#画面遷移url設計)
5. [プロジェクト構成](#プロジェクト構成)
6. [カレンダーUI設計](#カレンダーui設計)
7. [データフロー設計](#データフロー設計)
8. [API設計](#api設計)
9. [デザインシステム](#デザインシステム)
10. [環境構築手順](#環境構築手順)

---

## プロジェクト概要

### アプリ名
**Awase（アワセ）**

### コンセプト
- スマホでスムーズにドラッグ選択できるスケジュール調整アプリ
- ログイン不要、シンプルで軽量
- Googleカレンダー風のUI
- 30分単位で時間調整

### 主な機能
1. イベント作成（ホスト）
   - タイトル・説明入力
   - 複数日の候補日設定
   - 各日の時間範囲設定（例：09:00-18:00）
   - 共有URL発行

2. 回答（参加者）
   - カレンダーでドラッグして空き時間を選択
   - 名前入力
   - 編集コード（4桁）発行
   - 他の参加者の選択状況を確認

3. 編集
   - 名前 + 編集コードで回答を編集可能

4. 集計
   - 30分単位で参加可能人数を表示
   - 最適な時間帯の提示

### 主な特徴
- ✅ ログイン不要
- ✅ シンプルなUI
- ✅ スマホ最適化（ドラッグ選択）
- ✅ 30分単位固定
- ✅ 複数日対応
- ✅ 有効期限：1ヶ月

---

## 技術スタック

### コア技術
| 技術 | バージョン | 用途 |
|------|-----------|------|
| Next.js | 14+ (App Router) | フロントエンド・バックエンド |
| TypeScript | 5+ | 型安全性 |
| React | 18+ | UIライブラリ |
| Tailwind CSS | 3+ | スタイリング |
| Supabase | Latest | データベース（PostgreSQL） |
| @supabase/supabase-js | Latest | Supabaseクライアント |
| Supabase CLI | Latest | 型生成・マイグレーション |
| Vercel | - | デプロイ |

### 追加ライブラリ
| ライブラリ | 用途 |
|-----------|------|
| Zustand | 状態管理 |
| Zustand persist middleware | localStorage連携 |
| shadcn/ui | UIコンポーネント |
| Lucide React | アイコン |
| date-fns | 日付操作 |
| clsx & tailwind-merge | classnames utility |

### データベース・型管理
- **Supabase Client のみ使用**
- **Prismaは使用しない**
- Supabase CLIで型を自動生成
- マイグレーションはSupabase Migrationsで管理

### カレンダーUI実装
- **自作**（Googleカレンダー風）
- **ネイティブ Pointer Events** でドラッグ選択

---

## データモデル設計

### ER図概要
```
events (イベント)
  ↓ 1:N
candidate_dates (候補日)

events (イベント)
  ↓ 1:N
responses (回答)
  ↓ 1:N
availability_blocks (選択時間帯)
```

### テーブル定義

#### events（イベント）
| カラム名 | 型 | 制約 | 説明 |
|---------|-----|-----|------|
| id | uuid | PRIMARY KEY | イベントID |
| title | text | NOT NULL | イベントタイトル |
| description | text | NULLABLE | 説明 |
| url_slug | text | UNIQUE, NOT NULL | 共有用URL（例：abc123xyz） |
| created_at | timestamptz | NOT NULL, DEFAULT now() | 作成日時 |
| expires_at | timestamptz | NOT NULL | 有効期限（作成日 + 1ヶ月） |

**インデックス:**
```sql
CREATE UNIQUE INDEX idx_events_url_slug ON events(url_slug);
```

**SQL:**
```sql
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  url_slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);
```

---

#### candidate_dates（候補日）
| カラム名 | 型 | 制約 | 説明 |
|---------|-----|-----|------|
| id | uuid | PRIMARY KEY | 候補日ID |
| event_id | uuid | FOREIGN KEY → events(id), NOT NULL | イベントID |
| date | date | NOT NULL | 候補日（例：2025-11-05） |
| start_time | time | NOT NULL | 開始時刻（例：09:00） |
| end_time | time | NOT NULL | 終了時刻（例：18:00） |
| created_at | timestamptz | NOT NULL, DEFAULT now() | 作成日時 |

**インデックス:**
```sql
CREATE INDEX idx_candidate_dates_event_id ON candidate_dates(event_id);
```

**SQL:**
```sql
CREATE TABLE candidate_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

#### responses（回答）
| カラム名 | 型 | 制約 | 説明 |
|---------|-----|-----|------|
| id | uuid | PRIMARY KEY | 回答ID |
| event_id | uuid | FOREIGN KEY → events(id), NOT NULL | イベントID |
| participant_name | text | NOT NULL | 参加者名 |
| edit_code | text | NOT NULL | 編集コード（4桁） |
| created_at | timestamptz | NOT NULL, DEFAULT now() | 作成日時 |
| updated_at | timestamptz | NOT NULL, DEFAULT now() | 更新日時 |

**制約:**
```sql
UNIQUE(event_id, participant_name)  -- 同一イベント内で名前重複防止
```

**インデックス:**
```sql
CREATE INDEX idx_responses_event_id ON responses(event_id);
CREATE INDEX idx_responses_name_code ON responses(event_id, participant_name, edit_code);
```

**SQL:**
```sql
CREATE TABLE responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  participant_name TEXT NOT NULL,
  edit_code TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id, participant_name)
);
```

---

#### availability_blocks（選択時間帯）
| カラム名 | 型 | 制約 | 説明 |
|---------|-----|-----|------|
| id | uuid | PRIMARY KEY | 時間帯ID |
| response_id | uuid | FOREIGN KEY → responses(id), NOT NULL | 回答ID |
| date | date | NOT NULL | 日付（例：2025-11-05） |
| start_time | time | NOT NULL | 開始時刻（例：14:00） |
| end_time | time | NOT NULL | 終了時刻（例：16:30） |
| created_at | timestamptz | NOT NULL, DEFAULT now() | 作成日時 |

**インデックス:**
```sql
CREATE INDEX idx_availability_blocks_response_id ON availability_blocks(response_id);
CREATE INDEX idx_availability_blocks_date ON availability_blocks(date);
```

**SQL:**
```sql
CREATE TABLE availability_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id UUID NOT NULL REFERENCES responses(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

### 完全なマイグレーションSQL

```sql
-- supabase/migrations/20250101000000_initial_schema.sql

-- eventsテーブル
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  url_slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- candidate_datesテーブル
CREATE TABLE candidate_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- responsesテーブル
CREATE TABLE responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  participant_name TEXT NOT NULL,
  edit_code TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id, participant_name)
);

-- availability_blocksテーブル
CREATE TABLE availability_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id UUID NOT NULL REFERENCES responses(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- インデックス
CREATE UNIQUE INDEX idx_events_url_slug ON events(url_slug);
CREATE INDEX idx_candidate_dates_event_id ON candidate_dates(event_id);
CREATE INDEX idx_responses_event_id ON responses(event_id);
CREATE INDEX idx_responses_name_code ON responses(event_id, participant_name, edit_code);
CREATE INDEX idx_availability_blocks_response_id ON availability_blocks(response_id);
CREATE INDEX idx_availability_blocks_date ON availability_blocks(date);
```

---

### データモデルの特徴

1. **時間単位：30分固定**
   - UI側で30分単位で選択
   - DBには連続した時間帯をブロックとして保存（例：14:00-16:30）

2. **編集方法：名前 + 編集コード**
   - `participant_name` + `edit_code` で認証
   - URLを失っても編集可能

3. **有効期限：1ヶ月**
   - `expires_at` で管理
   - 古いイベントの自動削除（バッチ処理）

4. **複数日対応**
   - `candidate_dates` テーブルで複数日を管理
   - 各日ごとに異なる時間範囲を設定可能

---

## 画面遷移・URL設計

### URL一覧

| URL | ページ | 説明 |
|-----|--------|------|
| `/` | トップページ | 「イベント作成」ボタンのみ |
| `/create` | イベント作成 | タイトル、候補日設定 |
| `/event/[slug]` | イベント詳細 | イベント情報、参加者一覧 |
| `/event/[slug]/respond` | 回答画面 | カレンダーで時間選択 |
| `/event/[slug]/edit` | 編集画面 | 名前+コード入力→編集 |
| `/event/[slug]/result` | 集計結果 | 30分単位の集計表示 |

---

### 画面フロー

#### ホスト（イベント作成者）
```
/ (トップ)
  ↓ 「イベント作成」ボタン
/create (イベント作成フォーム)
  ↓ 送信
完了画面（URL表示）
```

#### 参加者（回答）
```
/event/[slug] (イベント詳細)
  ↓ 「回答する」ボタン
/event/[slug]/respond (回答画面)
  ↓ カレンダーで選択 → 名前入力 → 送信
完了画面（編集コード表示）
```

#### 編集
```
/event/[slug] (イベント詳細)
  ↓ 「編集する」ボタン
/event/[slug]/edit (編集画面)
  ↓ 名前+コード入力
/event/[slug]/respond (編集モード)
  ↓ 更新
完了画面
```

#### 集計結果確認
```
/event/[slug] (イベント詳細)
  ↓ 「結果を見る」ボタン
/event/[slug]/result (集計結果)
```

---

### 各ページの詳細

#### 1. `/` - トップページ
**表示内容:**
- Awaseロゴ
- キャッチコピー
- 「イベントを作成」ボタン（大きく目立つ）

**アクション:**
- ボタンクリック → `/create` へ遷移

---

#### 2. `/create` - イベント作成ページ
**表示内容:**
- タイトル入力欄
- 説明入力欄（任意）
- 候補日追加フォーム
  - 日付選択
  - 開始時刻・終了時刻選択
  - 「候補日を追加」ボタン
- 追加済み候補日リスト（削除可能）
- 「イベントを作成」ボタン

**バリデーション:**
- タイトル：必須
- 候補日：1つ以上必須
- 開始時刻 < 終了時刻

**アクション:**
- 送信 → Supabaseにデータ保存 → URL発行 → 完了画面

---

#### 3. `/event/[slug]` - イベント詳細ページ
**表示内容:**
- イベントタイトル・説明
- 候補日一覧
- 参加者一覧（名前、回答日時）
- アクションボタン
  - 「回答する」
  - 「編集する」
  - 「結果を見る」
- 共有用URLのコピーボタン

**アクション:**
- 「回答する」→ `/event/[slug]/respond`
- 「編集する」→ `/event/[slug]/edit`
- 「結果を見る」→ `/event/[slug]/result`

---

#### 4. `/event/[slug]/respond` - 回答画面
**表示内容:**
- イベントタイトル
- カレンダーUI（横スクロール）
  - 複数日の候補日を横並び
  - 30分単位のグリッド
  - 他の参加者の選択状況（紫バッジで人数表示）
- 参加者名入力欄
- 「すべてクリア」ボタン
- 「送信する」ボタン

**操作:**
1. カレンダーでドラッグして時間選択
2. 名前を入力
3. 「送信する」→ 確認モーダル表示
4. 確認 → 送信 → 編集コード表示

**確認モーダル:**
- 選択した時間帯をカレンダー形式で表示
- 「戻る」「送信する」ボタン

---

#### 5. `/event/[slug]/edit` - 編集画面
**表示内容:**
- 名前入力欄
- 編集コード入力欄（4桁）
- 「編集画面へ」ボタン

**アクション:**
- 認証成功 → `/event/[slug]/respond`（編集モード）
- 認証失敗 → エラーメッセージ表示

---

#### 6. `/event/[slug]/result` - 集計結果ページ
**表示内容:**
- イベントタイトル
- 30分単位の集計表
  - 日付・時刻・参加可能人数
  - 最も多い時間帯をハイライト
- 参加者一覧

**表示形式（案）:**
```
┌─────────────┬──────┐
│ 日時        │ 人数 │
├─────────────┼──────┤
│ 11/5 10:00  │ ★6人 │ ← 最多
│ 11/5 10:30  │ ★6人 │
│ 11/5 11:00  │ 3人  │
│ 11/6 14:00  │ 5人  │
└─────────────┴──────┘
```

---

## プロジェクト構成

### ディレクトリ構造

```
awase/
├── src/
│   ├── app/
│   │   ├── layout.tsx                 # ルートレイアウト
│   │   ├── page.tsx                   # トップページ (/)
│   │   ├── globals.css                # グローバルスタイル
│   │   │
│   │   ├── create/
│   │   │   └── page.tsx               # イベント作成 (/create)
│   │   │
│   │   ├── event/
│   │   │   └── [slug]/
│   │   │       ├── page.tsx           # イベント詳細 (/event/[slug])
│   │   │       ├── respond/
│   │   │       │   └── page.tsx       # 回答画面
│   │   │       ├── edit/
│   │   │       │   └── page.tsx       # 編集画面
│   │   │       └── result/
│   │   │           └── page.tsx       # 集計結果
│   │   │
│   │   └── api/
│   │       └── events/
│   │           ├── route.ts           # POST /api/events
│   │           └── [slug]/
│   │               ├── route.ts       # GET /api/events/[slug]
│   │               ├── responses/
│   │               │   └── route.ts   # POST/PUT /api/events/[slug]/responses
│   │               └── summary/
│   │                   └── route.ts   # GET /api/events/[slug]/summary
│   │
│   ├── components/
│   │   ├── ui/                        # shadcn/ui コンポーネント
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── card.tsx
│   │   │   └── modal.tsx
│   │   │
│   │   ├── calendar/                  # カレンダー関連
│   │   │   ├── Calendar.tsx           # メインカレンダー
│   │   │   ├── DayColumn.tsx          # 1日分の列
│   │   │   ├── TimeGrid.tsx           # 時間グリッド
│   │   │   ├── TimeSlot.tsx           # 30分スロット
│   │   │   ├── TimeLabels.tsx         # 時間ラベル
│   │   │   └── ScrollIndicator.tsx    # スクロールインジケーター
│   │   │
│   │   ├── event/                     # イベント関連
│   │   │   ├── EventForm.tsx          # イベント作成フォーム
│   │   │   ├── CandidateDateForm.tsx  # 候補日フォーム
│   │   │   ├── ParticipantList.tsx    # 参加者一覧
│   │   │   ├── ConfirmationModal.tsx  # 確認モーダル
│   │   │   └── ResultSummary.tsx      # 集計結果表示
│   │   │
│   │   └── layout/
│   │       ├── Header.tsx             # ヘッダー
│   │       └── Footer.tsx             # フッター
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts              # Supabase クライアント（型付き）
│   │   │   └── types.ts               # Supabase生成型定義
│   │   │
│   │   ├── store/
│   │   │   ├── eventStore.ts          # イベント作成用ストア
│   │   │   └── responseStore.ts       # 回答選択用ストア
│   │   │
│   │   └── utils/
│   │       ├── dateUtils.ts           # 日付操作
│   │       ├── slugGenerator.ts       # URL slug生成
│   │       ├── timeSlotCalculator.ts  # 30分単位計算
│   │       └── cn.ts                  # classnames utility
│   │
│   └── types/
│       └── index.ts                   # 共通型定義
│
├── public/
│   ├── logo.svg                       # ロゴ
│   └── favicon.svg                    # ファビコン
│
├── supabase/
│   ├── migrations/                    # DBマイグレーション
│   │   └── 20250101000000_initial_schema.sql
│   └── seed.sql                       # テストデータ
│
├── .env.local                         # 環境変数
├── .gitignore
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

### 主要ファイルの役割と実装

#### `lib/supabase/client.ts` - 型付きSupabaseクライアント
```typescript
import { createClient } from '@supabase/supabase-js'
import { Database } from './types'

export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// 使用例（型安全）
const { data, error } = await supabase
  .from('events')
  .select('*')
  .eq('url_slug', slug)
  .single()

// data は Events型として推論される
```

#### `lib/supabase/types.ts` - 自動生成される型定義
```bash
# 型生成コマンド
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/supabase/types.ts
```

```typescript
// 自動生成される型の例
export type Database = {
  public: {
    Tables: {
      events: {
        Row: {
          id: string
          title: string
          description: string | null
          url_slug: string
          created_at: string
          expires_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          url_slug: string
          created_at?: string
          expires_at: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          url_slug?: string
          created_at?: string
          expires_at?: string
        }
      }
      // ... 他のテーブル
    }
  }
}
```

#### `lib/utils/cn.ts` - Tailwind classnames utility
```typescript
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

---

## カレンダーUI設計

### 全体構成

```
┌─────────┬──────────────────────────────────────┐
│ 時刻    │  候補日（横スクロール）               │
│         │  ← → スクロールインジケーター        │
├─────────┼────────┬────────┬────────┬────────┤
│ 09:00   │ 11/5   │ 11/6   │ 11/7   │ 11/8   │
├─────────┼────────┼────────┼────────┼────────┤
│         │ □ [2]  │ □ [5]  │ □      │ □ [1]  │
│ 10:00   │ ■■[6] │ □ [6]  │ ■■[3] │ □ [1]  │
│         │ ■■[6] │ □ [6]  │ ■■[3] │ □ [2]  │
│ 11:00   │ □ [3]  │ ■■[7] │ □ [2]  │ □ [2]  │
│         │ □ [3]  │ ■■[7] │ □ [2]  │ □      │
└─────────┴────────┴────────┴────────┴────────┘

凡例:
■■ = 自分の選択（赤背景）
□  = 未選択（白背景）
[N] = 参加者数（紫バッジ）
```

---

### コンポーネント構成

```
Calendar.tsx (メインコンテナ)
│
├── ScrollIndicator.tsx (左右のグラデーション)
│
├── TimeLabels.tsx (左側固定の時間軸)
│   └── 09:00, 10:00, 11:00 ... 表示
│
└── DaysScrollContainer.tsx (横スクロール可能)
    │
    └── DayColumn.tsx ×N (1日分の列)
        │
        ├── DayHeader.tsx (日付ヘッダー)
        │   └── "11/5 (火)"
        │
        └── TimeGrid.tsx (時間グリッド)
            │
            └── TimeSlot.tsx ×N (30分単位のスロット)
                ├── 背景色（選択状態）
                └── 参加者数バッジ
```

---

### 各コンポーネントの詳細

#### 1. `Calendar.tsx` - メインコンテナ

**Props:**
```typescript
interface CalendarProps {
  candidateDates: CandidateDate[]
  selectedSlots: TimeSlot[]
  participantCounts: Record<string, number>  // "2025-11-05-10:00" → 6
  onSlotsChange: (slots: TimeSlot[]) => void
  mode: 'select' | 'view'
}
```

**レイアウト:**
```tsx
<div className="calendar-wrapper relative">
  <div className="flex">
    {/* 左側固定 */}
    <div className="sticky left-0 z-10 bg-white">
      <TimeLabels startTime="09:00" endTime="18:00" />
    </div>
    
    {/* 横スクロール */}
    <div className="overflow-x-auto flex-1">
      <ScrollIndicator />
      <div className="flex gap-2">
        {candidateDates.map(date => (
          <DayColumn key={date.id} date={date} />
        ))}
      </div>
    </div>
  </div>
</div>
```

---

#### 2. `DayColumn.tsx` - 1日分の列

**Props:**
```typescript
interface DayColumnProps {
  date: CandidateDate
  selectedSlots: TimeSlot[]
  participantCounts: Record<string, number>
  onSlotsChange: (slots: TimeSlot[]) => void
}
```

**スタイル:**
```tsx
<div className="day-column w-[120px] flex-shrink-0">
  <DayHeader date={date.date} />
  <TimeGrid 
    date={date.date}
    startTime={date.start_time}
    endTime={date.end_time}
    selectedSlots={selectedSlots}
    participantCounts={participantCounts}
    onSlotsChange={onSlotsChange}
  />
</div>
```

---

#### 3. `TimeGrid.tsx` - ドラッグ選択の核心

**Props:**
```typescript
interface TimeGridProps {
  date: string
  startTime: string
  endTime: string
  selectedSlots: TimeSlot[]
  participantCounts: Record<string, number>
  onSlotsChange: (slots: TimeSlot[]) => void
}
```

**ドラッグ選択ロジック:**
```typescript
const [isDragging, setIsDragging] = useState(false)
const [dragMode, setDragMode] = useState<'select' | 'deselect'>('select')

const handlePointerDown = (e: PointerEvent, slot: TimeSlot) => {
  e.preventDefault()
  setIsDragging(true)
  
  // 最初のスロットが選択済みなら解除モード
  const isAlreadySelected = selectedSlots.some(s => 
    s.date === slot.date && s.time === slot.time
  )
  setDragMode(isAlreadySelected ? 'deselect' : 'select')
  
  toggleSlot(slot, dragMode)
}

const handlePointerMove = (e: PointerEvent) => {
  if (!isDragging) return
  
  const currentSlot = getSlotFromPointer(e)
  if (currentSlot) {
    toggleSlot(currentSlot, dragMode)
  }
}

const handlePointerUp = () => {
  setIsDragging(false)
}
```

---

#### 4. `TimeSlot.tsx` - 30分単位のスロット

**Props:**
```typescript
interface TimeSlotProps {
  time: string          // "10:00"
  isSelected: boolean
  participantCount: number
  mode: 'edit' | 'view'
}
```

**スタイル:**
```tsx
<div 
  className={cn(
    "time-slot relative h-12 border-b border-gray-200",
    // 自分の選択（赤）
    isSelected && "bg-primary-400",
    // ホバー
    mode === 'edit' && !isSelected && "hover:bg-gray-50 cursor-pointer"
  )}
>
  {/* 参加者数バッジ（紫） */}
  {participantCount > 0 && (
    <span className={cn(
      "absolute top-1 right-1 text-xs px-1.5 py-0.5 rounded font-semibold text-white",
      isSelected 
        ? "bg-secondary-600"  // 濃い紫
        : "bg-secondary-500"  // 通常の紫
    )}>
      {participantCount}
    </span>
  )}
</div>
```

---

#### 5. `TimeLabels.tsx` - 時間ラベル（左側固定）

**表示内容:**
- 1時間ごとにラベル表示（09:00, 10:00, 11:00...）
- 各時間の高さ = 96px（30分×2）

```tsx
<div className="time-labels">
  {timeLabels.map(time => (
    <div key={time} className="h-24 flex items-center pr-2 text-xs text-gray-500">
      {time}
    </div>
  ))}
</div>
```

---

#### 6. `ScrollIndicator.tsx` - スクロールインジケーター

**表示内容:**
- 左端：スクロール位置 > 0 なら左グラデーション
- 右端：さらにコンテンツがあれば右グラデーション + 矢印

```tsx
<>
  {/* 左端 */}
  {scrollPosition > 0 && (
    <div className="absolute left-0 inset-y-0 w-8 bg-gradient-to-r from-white to-transparent pointer-events-none z-20" />
  )}
  
  {/* 右端 */}
  {hasMoreContent && (
    <div className="absolute right-0 inset-y-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none z-20">
      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-primary-500">
        →
      </div>
    </div>
  )}
</>
```

---

### UX設計

#### 誤タップ・誤選択の防止策

1. **ビジュアルフィードバック**
   - ドラッグ中：薄い色でプレビュー
   - 確定後：濃い色で表示

2. **確認モーダル**
   - 送信前に選択内容をカレンダー形式で表示
   - 「戻る」ボタンで編集可能

3. **編集のしやすさ**
   - 「すべてクリア」ボタン
   - ドラッグで選択/解除の切り替え

#### 参加者数の確認（省スペース）

- 各TimeSlotの右上に小さく紫バッジで表示
- 自分の選択と同時に確認可能
- 画面幅を取らない

#### スクロールインジケーター

- 左右のグラデーション表示
- 右端に矢印（→）表示
- スクロール可能であることを明示

---

### レスポンシブ対応

#### スマホ（優先）
- 横スクロール
- タッチ操作最適化
- DayColumn幅：120px

#### タブレット
- 同様の横スクロール
- DayColumn幅：150px（やや広め）

#### PC
- 横スクロール or 全体表示
- マウス操作対応

---

## データフロー設計

### Zustand ストア

#### 1. `responseStore.ts` - 回答選択用

**役割:**
- カレンダーでの時間選択状態を管理
- ドラッグ選択のロジック
- localStorage連携（persist middleware）

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface TimeSlot {
  date: string  // "2025-11-05"
  time: string  // "10:00"
}

interface AvailabilityBlock {
  date: string
  start_time: string
  end_time: string
}

interface ResponseStore {
  // 状態
  participantName: string
  selectedSlots: TimeSlot[]
  
  // アクション
  setParticipantName: (name: string) => void
  toggleSlot: (slot: TimeSlot) => void
  addSlotRange: (slots: TimeSlot[]) => void
  clearAllSlots: () => void
  
  // ヘルパー
  isSlotSelected: (slot: TimeSlot) => boolean
  getAvailabilityBlocks: () => AvailabilityBlock[]
}

export const useResponseStore = create(
  persist<ResponseStore>(
    (set, get) => ({
      participantName: '',
      selectedSlots: [],
      
      setParticipantName: (name) => set({ participantName: name }),
      
      toggleSlot: (slot) => set((state) => {
        const exists = state.selectedSlots.some(
          s => s.date === slot.date && s.time === slot.time
        )
        
        if (exists) {
          return {
            selectedSlots: state.selectedSlots.filter(
              s => !(s.date === slot.date && s.time === slot.time)
            )
          }
        } else {
          return {
            selectedSlots: [...state.selectedSlots, slot]
          }
        }
      }),
      
      addSlotRange: (slots) => set((state) => {
        const newSlots = slots.filter(slot => 
          !state.selectedSlots.some(
            s => s.date === slot.date && s.time === slot.time
          )
        )
        return {
          selectedSlots: [...state.selectedSlots, ...newSlots]
        }
      }),
      
      clearAllSlots: () => set({ selectedSlots: [] }),
      
      isSlotSelected: (slot) => {
        return get().selectedSlots.some(
          s => s.date === slot.date && s.time === slot.time
        )
      },
      
      getAvailabilityBlocks: () => {
        const slots = get().selectedSlots
        return mergeConsecutiveSlots(slots)
      }
    }),
    {
      name: 'awase-response-storage',
    }
  )
)
```

---

#### 2. `eventStore.ts` - イベント作成用

**役割:**
- イベント作成フォームの状態管理
- 候補日と時間範囲の管理

```typescript
import { create } from 'zustand'

interface CandidateDate {
  id: string
  date: string
  start_time: string
  end_time: string
}

interface EventStore {
  // 状態
  title: string
  description: string
  candidateDates: CandidateDate[]
  
  // アクション
  setTitle: (title: string) => void
  setDescription: (description: string) => void
  addCandidateDate: (date: CandidateDate) => void
  removeCandidateDate: (id: string) => void
  updateCandidateDate: (id: string, updates: Partial<CandidateDate>) => void
  clearForm: () => void
}

export const useEventStore = create<EventStore>((set) => ({
  title: '',
  description: '',
  candidateDates: [],
  
  setTitle: (title) => set({ title }),
  setDescription: (description) => set({ description }),
  
  addCandidateDate: (date) => set((state) => ({
    candidateDates: [...state.candidateDates, date]
  })),
  
  removeCandidateDate: (id) => set((state) => ({
    candidateDates: state.candidateDates.filter(d => d.id !== id)
  })),
  
  updateCandidateDate: (id, updates) => set((state) => ({
    candidateDates: state.candidateDates.map(d =>
      d.id === id ? { ...d, ...updates } : d
    )
  })),
  
  clearForm: () => set({
    title: '',
    description: '',
    candidateDates: []
  })
}))
```

---

### データフロー図

#### 回答画面のフロー

```
1. ページロード (/event/[slug]/respond)
   ↓
2. Supabaseからデータ取得
   - イベント情報（events）
   - 候補日（candidate_dates）
   - 既存の回答（responses + availability_blocks）
   ↓
3. 参加者数を集計
   - availability_blocks を解析
   - 30分単位でカウント
   ↓
4. カレンダー表示
   - useResponseStore で選択状態管理
   - localStorage から前回の選択を復元（あれば）
   ↓
5. ドラッグ選択
   - toggleSlot() で状態更新
   - リアルタイムでUIに反映
   ↓
6. 送信ボタン
   - getAvailabilityBlocks() で連続時間を結合
   - 確認モーダル表示
   ↓
7. 確定
   - POST /api/events/[slug]/responses
   - Supabaseに保存
   - 編集コード発行
   ↓
8. 完了画面
   - 編集コード表示
   - localStorage クリア
```

---

#### イベント作成画面のフロー

```
1. ページロード (/create)
   ↓
2. フォーム表示
   - useEventStore で状態管理
   ↓
3. 入力
   - タイトル、説明
   - 候補日を追加
   ↓
4. 送信
   - バリデーション
   - POST /api/events
   - Supabaseに保存
   - URL slug生成
   ↓
5. 完了画面
   - 共有URL表示
   - clearForm() でストアをリセット
```

---

#### 編集画面のフロー

```
1. ページロード (/event/[slug]/edit)
   ↓
2. 認証フォーム表示
   - 名前入力
   - 編集コード入力（4桁）
   ↓
3. 認証
   - Supabaseでvalidation
   ↓
4. 認証成功
   - 既存の回答をuseResponseStoreに読み込み
   - /event/[slug]/respond へ遷移（編集モード）
   ↓
5. 編集
   - カレンダーで選択を変更
   ↓
6. 更新
   - PUT /api/events/[slug]/responses
   - Supabaseを更新
   ↓
7. 完了画面
```

---

### ヘルパー関数

#### `mergeConsecutiveSlots()` - 連続時間の結合

```typescript
// lib/utils/timeSlotCalculator.ts

interface TimeSlot {
  date: string
  time: string
}

interface AvailabilityBlock {
  date: string
  start_time: string
  end_time: string
}

export function mergeConsecutiveSlots(
  slots: TimeSlot[]
): AvailabilityBlock[] {
  if (slots.length === 0) return []
  
  // 日付でグループ化
  const byDate = slots.reduce((acc, slot) => {
    if (!acc[slot.date]) {
      acc[slot.date] = []
    }
    acc[slot.date].push(slot)
    return acc
  }, {} as Record<string, TimeSlot[]>)
  
  const blocks: AvailabilityBlock[] = []
  
  for (const [date, dateSlots] of Object.entries(byDate)) {
    // 時間でソート
    const sorted = [...dateSlots].sort((a, b) => 
      a.time.localeCompare(b.time)
    )
    
    // 連続する時間を結合
    let currentBlock: AvailabilityBlock | null = null
    
    for (const slot of sorted) {
      if (!currentBlock) {
        // 新しいブロック開始
        currentBlock = {
          date,
          start_time: slot.time,
          end_time: addMinutes(slot.time, 30)
        }
      } else if (currentBlock.end_time === slot.time) {
        // 連続している → 終了時刻を延長
        currentBlock.end_time = addMinutes(slot.time, 30)
      } else {
        // 連続していない → 現在のブロックを保存して新しいブロック開始
        blocks.push(currentBlock)
        currentBlock = {
          date,
          start_time: slot.time,
          end_time: addMinutes(slot.time, 30)
        }
      }
    }
    
    // 最後のブロックを保存
    if (currentBlock) {
      blocks.push(currentBlock)
    }
  }
  
  return blocks
}

// 時刻に分を加算
function addMinutes(time: string, minutes: number): string {
  const [hours, mins] = time.split(':').map(Number)
  const totalMinutes = hours * 60 + mins + minutes
  const newHours = Math.floor(totalMinutes / 60)
  const newMins = totalMinutes % 60
  return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`
}
```

---

#### `generateTimeSlots()` - 30分単位のスロット生成

```typescript
export function generateTimeSlots(
  startTime: string,
  endTime: string
): string[] {
  const slots: string[] = []
  let current = startTime
  
  while (current < endTime) {
    slots.push(current)
    current = addMinutes(current, 30)
  }
  
  return slots
}

// 使用例
generateTimeSlots('09:00', '12:00')
// → ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30']
```

---

#### `generateSlug()` - URL slug生成

```typescript
// lib/utils/slugGenerator.ts

export function generateSlug(length: number = 10): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let slug = ''
  
  for (let i = 0; i < length; i++) {
    slug += chars[Math.floor(Math.random() * chars.length)]
  }
  
  return slug
}

// 使用例
generateSlug()
// → "a3k9x2m7b1"
```

---

### localStorage管理

#### イベントごとにストアをクリア

```typescript
// app/event/[slug]/respond/page.tsx

useEffect(() => {
  const storedEventId = localStorage.getItem('awase-current-event-id')
  
  // 違うイベントに遷移した場合、ストアをクリア
  if (storedEventId !== params.slug) {
    useResponseStore.getState().clearAllSlots()
    useResponseStore.getState().setParticipantName('')
    localStorage.setItem('awase-current-event-id', params.slug)
  }
}, [params.slug])
```

---

## API設計

### エンドポイント一覧

| メソッド | エンドポイント | 説明 |
|---------|---------------|------|
| POST | `/api/events` | イベント作成 |
| GET | `/api/events/[slug]` | イベント詳細取得 |
| POST | `/api/events/[slug]/responses` | 回答送信 |
| PUT | `/api/events/[slug]/responses` | 回答更新（編集） |
| GET | `/api/events/[slug]/summary` | 集計結果取得 |

---

### 1. POST `/api/events` - イベント作成

**リクエスト:**
```typescript
{
  title: string
  description?: string
  candidateDates: {
    date: string        // "2025-11-05"
    start_time: string  // "09:00"
    end_time: string    // "18:00"
  }[]
}
```

**レスポンス:**
```typescript
{
  slug: string  // "abc123xyz"
  url: string   // "/event/abc123xyz"
}
```

**実装:**
```typescript
// app/api/events/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { generateSlug } from '@/lib/utils/slugGenerator'

export async function POST(request: NextRequest) {
  const body = await request.json()
  
  // バリデーション
  if (!body.title || !body.candidateDates || body.candidateDates.length === 0) {
    return NextResponse.json(
      { error: 'タイトルと候補日は必須です' }, 
      { status: 400 }
    )
  }
  
  // URL slug生成（ユニークになるまでリトライ）
  let slug = generateSlug()
  let isUnique = false
  
  while (!isUnique) {
    const { data } = await supabase
      .from('events')
      .select('id')
      .eq('url_slug', slug)
      .single()
    
    if (!data) {
      isUnique = true
    } else {
      slug = generateSlug()
    }
  }
  
  // イベント作成
  const expiresAt = new Date()
  expiresAt.setMonth(expiresAt.getMonth() + 1)  // 1ヶ月後
  
  const { data: event, error: eventError } = await supabase
    .from('events')
    .insert({
      title: body.title,
      description: body.description || null,
      url_slug: slug,
      expires_at: expiresAt.toISOString()
    })
    .select()
    .single()
  
  if (eventError) {
    return NextResponse.json(
      { error: eventError.message }, 
      { status: 500 }
    )
  }
  
  // 候補日を一括挿入
  const { error: datesError } = await supabase
    .from('candidate_dates')
    .insert(
      body.candidateDates.map(date => ({
        event_id: event.id,
        date: date.date,
        start_time: date.start_time,
        end_time: date.end_time
      }))
    )
  
  if (datesError) {
    return NextResponse.json(
      { error: datesError.message }, 
      { status: 500 }
    )
  }
  
  return NextResponse.json({
    slug,
    url: `/event/${slug}`
  })
}
```

---

### 2. GET `/api/events/[slug]` - イベント詳細取得

**レスポンス:**
```typescript
{
  id: string
  title: string
  description: string | null
  url_slug: string
  created_at: string
  expires_at: string
  candidateDates: {
    id: string
    date: string
    start_time: string
    end_time: string
  }[]
  responses: {
    id: string
    participant_name: string
    created_at: string
  }[]
}
```

**実装:**
```typescript
// app/api/events/[slug]/route.ts

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { data: event, error } = await supabase
    .from('events')
    .select(`
      *,
      candidate_dates(*),
      responses(id, participant_name, created_at)
    `)
    .eq('url_slug', params.slug)
    .single()
  
  if (error || !event) {
    return NextResponse.json(
      { error: 'イベントが見つかりません' }, 
      { status: 404 }
    )
  }
  
  // 有効期限チェック
  if (new Date(event.expires_at) < new Date()) {
    return NextResponse.json(
      { error: 'このイベントは有効期限切れです' }, 
      { status: 410 }
    )
  }
  
  return NextResponse.json(event)
}
```

---

### 3. POST `/api/events/[slug]/responses` - 回答送信

**リクエスト:**
```typescript
{
  participant_name: string
  availability_blocks: {
    date: string
    start_time: string
    end_time: string
  }[]
}
```

**レスポンス:**
```typescript
{
  response_id: string
  edit_code: string  // "1234"
}
```

**実装:**
```typescript
// app/api/events/[slug]/responses/route.ts

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const body = await request.json()
  
  // バリデーション
  if (!body.participant_name || !body.availability_blocks) {
    return NextResponse.json(
      { error: '名前と選択時間は必須です' }, 
      { status: 400 }
    )
  }
  
  // イベントID取得
  const { data: event } = await supabase
    .from('events')
    .select('id')
    .eq('url_slug', params.slug)
    .single()
  
  if (!event) {
    return NextResponse.json(
      { error: 'イベントが見つかりません' }, 
      { status: 404 }
    )
  }
  
  // 編集コード生成（4桁）
  const editCode = Math.floor(1000 + Math.random() * 9000).toString()
  
  // 回答作成
  const { data: response, error: responseError } = await supabase
    .from('responses')
    .insert({
      event_id: event.id,
      participant_name: body.participant_name,
      edit_code: editCode
    })
    .select()
    .single()
  
  if (responseError) {
    // 名前重複エラー
    if (responseError.code === '23505') {
      return NextResponse.json(
        { error: 'この名前は既に使用されています' }, 
        { status: 409 }
      )
    }
    return NextResponse.json(
      { error: responseError.message }, 
      { status: 500 }
    )
  }
  
  // 時間帯を一括挿入
  if (body.availability_blocks.length > 0) {
    const { error: blocksError } = await supabase
      .from('availability_blocks')
      .insert(
        body.availability_blocks.map(block => ({
          response_id: response.id,
          date: block.date,
          start_time: block.start_time,
          end_time: block.end_time
        }))
      )
    
    if (blocksError) {
      return NextResponse.json(
        { error: blocksError.message }, 
        { status: 500 }
      )
    }
  }
  
  return NextResponse.json({
    response_id: response.id,
    edit_code: editCode
  })
}
```

---

### 4. PUT `/api/events/[slug]/responses` - 回答更新

**リクエスト:**
```typescript
{
  participant_name: string
  edit_code: string
  availability_blocks: {
    date: string
    start_time: string
    end_time: string
  }[]
}
```

**レスポンス:**
```typescript
{
  success: true
}
```

**実装:**
```typescript
export async function PUT(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const body = await request.json()
  
  // イベントID取得
  const { data: event } = await supabase
    .from('events')
    .select('id')
    .eq('url_slug', params.slug)
    .single()
  
  if (!event) {
    return NextResponse.json(
      { error: 'イベントが見つかりません' }, 
      { status: 404 }
    )
  }
  
  // 名前とコードで回答を検証
  const { data: response } = await supabase
    .from('responses')
    .select('id')
    .eq('event_id', event.id)
    .eq('participant_name', body.participant_name)
    .eq('edit_code', body.edit_code)
    .single()
  
  if (!response) {
    return NextResponse.json(
      { error: '名前または編集コードが正しくありません' }, 
      { status: 401 }
    )
  }
  
  // 既存の時間帯を削除
  await supabase
    .from('availability_blocks')
    .delete()
    .eq('response_id', response.id)
  
  // 新しい時間帯を挿入
  if (body.availability_blocks.length > 0) {
    const { error: blocksError } = await supabase
      .from('availability_blocks')
      .insert(
        body.availability_blocks.map(block => ({
          response_id: response.id,
          date: block.date,
          start_time: block.start_time,
          end_time: block.end_time
        }))
      )
    
    if (blocksError) {
      return NextResponse.json(
        { error: blocksError.message }, 
        { status: 500 }
      )
    }
  }
  
  // updated_at を更新
  await supabase
    .from('responses')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', response.id)
  
  return NextResponse.json({ success: true })
}
```

---

### 5. GET `/api/events/[slug]/summary` - 集計結果取得

**レスポンス:**
```typescript
{
  summary: {
    date: string      // "2025-11-05"
    time: string      // "10:00"
    count: number     // 参加可能人数
  }[]
  participants: {
    name: string
    response_count: number
  }[]
}
```

**実装:**
```typescript
// app/api/events/[slug]/summary/route.ts

import { generateTimeSlots } from '@/lib/utils/timeSlotCalculator'

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  // イベントと候補日を取得
  const { data: event } = await supabase
    .from('events')
    .select(`
      id,
      candidate_dates(date, start_time, end_time)
    `)
    .eq('url_slug', params.slug)
    .single()
  
  if (!event) {
    return NextResponse.json(
      { error: 'イベントが見つかりません' }, 
      { status: 404 }
    )
  }
  
  // 全回答を取得
  const { data: responses } = await supabase
    .from('responses')
    .select(`
      participant_name,
      availability_blocks(date, start_time, end_time)
    `)
    .eq('event_id', event.id)
  
  // 30分単位で集計
  const summary = calculateSummary(
    event.candidate_dates,
    responses || []
  )
  
  // 参加者リスト
  const participants = (responses || []).map(r => ({
    name: r.participant_name,
    response_count: r.availability_blocks.length
  }))
  
  return NextResponse.json({
    summary,
    participants
  })
}

// 集計ロジック
function calculateSummary(candidateDates, responses) {
  const summary = []
  
  // 候補日ごとに30分単位のスロットを生成
  for (const candidate of candidateDates) {
    const timeSlots = generateTimeSlots(
      candidate.start_time,
      candidate.end_time
    )
    
    // 各スロットで何人が参加可能かカウント
    for (const time of timeSlots) {
      let count = 0
      
      for (const response of responses) {
        const isAvailable = response.availability_blocks.some(block =>
          block.date === candidate.date &&
          block.start_time <= time &&
          block.end_time > time
        )
        
        if (isAvailable) count++
      }
      
      summary.push({
        date: candidate.date,
        time,
        count
      })
    }
  }
  
  return summary
}
```

---

### エラーハンドリング

#### 共通エラーレスポンス

```typescript
{
  error: string  // エラーメッセージ
}
```

#### ステータスコード

| コード | 意味 | 使用例 |
|--------|------|--------|
| 200 | 成功 | GET成功 |
| 201 | 作成成功 | POST成功 |
| 400 | バリデーションエラー | 必須項目なし |
| 401 | 認証エラー | 編集コード不正 |
| 404 | 見つからない | イベント存在しない |
| 409 | 競合 | 名前重複 |
| 410 | 有効期限切れ | イベント期限切れ |
| 500 | サーバーエラー | DB接続エラー |

---

## デザインシステム

### ブランドカラー

#### プライマリ（赤）
```typescript
primary: {
  50: '#fef2f2',
  100: '#fee2e2',
  200: '#fecaca',
  300: '#fca5a5',
  400: '#f87171',  // 選択状態のメイン
  500: '#ef4444',  // ボタン、リンク
  600: '#dc2626',  // ホバー
  700: '#b91c1c',
  800: '#991b1b',
  900: '#7f1d1d',
}
```

**使用箇所:**
- 自分の選択状態（TimeSlot背景）
- プライマリボタン
- リンク
- アクセント

---

#### セカンダリ（紫）
```typescript
secondary: {
  50: '#faf5ff',
  100: '#f3e8ff',
  200: '#e9d5ff',
  300: '#d8b4fe',
  400: '#c084fc',
  500: '#a855f7',  // 参加者数バッジ
  600: '#9333ea',  // バッジ（選択済み）
  700: '#7e22ce',
  800: '#6b21a8',
  900: '#581c87',
}
```

**使用箇所:**
- 参加者数バッジ
- セカンダリボタン
- 補助的な要素

---

### タイポグラフィ

#### フォント
```typescript
// app/layout.tsx
import { Inter, Noto_Sans_JP } from 'next/font/google'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const notoSansJP = Noto_Sans_JP({ 
  subsets: ['japanese'],
  variable: '--font-noto-sans-jp',
  display: 'swap',
})
```

**使い分け:**
- 英数字：Inter
- 日本語：Noto Sans JP

---

#### サイズ
```typescript
fontSize: {
  'xs': '0.75rem',    // 12px - バッジ、補足
  'sm': '0.875rem',   // 14px - 本文小
  'base': '1rem',     // 16px - 本文
  'lg': '1.125rem',   // 18px - 見出し小
  'xl': '1.25rem',    // 20px - 見出し中
  '2xl': '1.5rem',    // 24px - 見出し大
  '3xl': '1.875rem',  // 30px - ページタイトル
}
```

---

### コンポーネントスタイル

#### ボタン

**Primary（赤）**
```tsx
<button className="
  px-6 py-3 
  bg-primary-500 hover:bg-primary-600 
  text-white font-semibold 
  rounded-lg 
  transition-colors
  shadow-sm hover:shadow-md
">
  送信する
</button>
```

**Secondary（紫）**
```tsx
<button className="
  px-6 py-3 
  bg-secondary-500 hover:bg-secondary-600 
  text-white font-semibold 
  rounded-lg 
  transition-colors
">
  戻る
</button>
```

**Outline**
```tsx
<button className="
  px-6 py-3 
  border-2 border-primary-500 
  text-primary-500 hover:bg-primary-50 
  font-semibold 
  rounded-lg 
  transition-colors
">
  編集する
</button>
```

---

#### 入力フィールド

```tsx
<input className="
  w-full px-4 py-3 
  border-2 border-gray-300 
  focus:border-primary-500 focus:ring-2 focus:ring-primary-100
  rounded-lg 
  outline-none 
  transition-all
" />
```

---

#### カード

```tsx
<div className="
  bg-white 
  border border-gray-200 
  rounded-lg 
  shadow-sm hover:shadow-md 
  p-6 
  transition-shadow
">
  コンテンツ
</div>
```

---

### ロゴ・アイコン

#### ロゴ（SVG）
```svg
<!-- public/logo.svg -->
<svg width="120" height="40" viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="awaseGradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#ef4444;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#a855f7;stop-opacity:1" />
    </linearGradient>
  </defs>
  <text 
    x="0" 
    y="30" 
    font-family="Inter, sans-serif" 
    font-size="32" 
    font-weight="700" 
    fill="url(#awaseGradient)"
  >
    Awase
  </text>
</svg>
```

---

#### ファビコン（SVG）
```svg
<!-- public/favicon.svg -->
<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="faviconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ef4444;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#a855f7;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="64" height="64" rx="12" fill="url(#faviconGradient)"/>
  <text 
    x="32" 
    y="45" 
    font-family="Inter, sans-serif" 
    font-size="36" 
    font-weight="700" 
    fill="white"
    text-anchor="middle"
  >
    A
  </text>
</svg>
```

---

#### アイコンライブラリ
```bash
npm install lucide-react
```

```tsx
import { Calendar, Clock, Users, Edit, Check } from 'lucide-react'

<Calendar className="w-5 h-5 text-primary-500" />
```

---

### レイアウト

#### 画面構成
```tsx
<body className="flex flex-col min-h-screen">
  <Header />
  
  <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8">
    {children}
  </main>
  
  <Footer />
</body>
```

---

#### ヘッダー
```tsx
<header className="border-b border-gray-200 bg-white">
  <div className="max-w-4xl mx-auto px-4 py-4">
    <Link href="/">
      <Image 
        src="/logo.svg" 
        alt="Awase" 
        width={120} 
        height={40}
      />
    </Link>
  </div>
</header>
```

---

#### フッター
```tsx
<footer className="border-t border-gray-200 bg-white mt-auto">
  <div className="max-w-4xl mx-auto px-4 py-6 text-center text-sm text-gray-500">
    © 2025 Awase. All rights reserved.
  </div>
</footer>
```

---

### メタデータ

```typescript
// app/layout.tsx
export const metadata: Metadata = {
  title: 'Awase - スムーズなスケジュール調整',
  description: 'スマホでサクッと時間調整。ドラッグで簡単に空き時間を選択できるスケジュール調整アプリ。',
  icons: {
    icon: '/favicon.svg',
  },
  openGraph: {
    title: 'Awase - スムーズなスケジュール調整',
    description: 'スマホでサクッと時間調整。ドラッグで簡単に空き時間を選択できるスケジュール調整アプリ。',
    type: 'website',
    locale: 'ja_JP',
  },
}
```

---

## 環境構築手順

### 1. Next.jsプロジェクト作成

```bash
npx create-next-app@latest awase
# ✔ Would you like to use TypeScript? … Yes
# ✔ Would you like to use ESLint? … Yes
# ✔ Would you like to use Tailwind CSS? … Yes
# ✔ Would you like to use `src/` directory? … Yes
# ✔ Would you like to use App Router? … Yes
# ✔ Would you like to customize the default import alias (@/*)? … No

cd awase
```

---

### 2. 必要なパッケージをインストール

```bash
# Supabase
npm install @supabase/supabase-js

# Supabase CLI（型生成用）
npm install supabase --save-dev

# Zustand（状態管理）
npm install zustand

# UI・ユーティリティ
npm install lucide-react
npm install clsx tailwind-merge
npm install date-fns

# shadcn/ui初期化
npx shadcn-ui@latest init
# ✔ Which style would you like to use? › Default
# ✔ Which color would you like to use as base color? › Slate
# ✔ Would you like to use CSS variables for colors? › yes

# shadcn/uiコンポーネント追加
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog
```

---

### 3. Supabaseプロジェクト作成

1. https://supabase.com にアクセス
2. 「New Project」をクリック
3. プロジェクト名、パスワード、リージョン（Tokyo）を設定
4. 「Create new project」をクリック
5. プロジェクトURLとAPIキーを取得

---

### 4. 環境変数設定

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxx
```

---

### 5. Supabaseマイグレーション実行

```bash
# Supabase CLIでログイン
npx supabase login

# プロジェクトと連携
npx supabase link --project-ref YOUR_PROJECT_ID

# マイグレーションファイル作成
npx supabase migration new initial_schema
```

`supabase/migrations/xxxxx_initial_schema.sql` に以下を記述:

```sql
-- eventsテーブル
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  url_slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- candidate_datesテーブル
CREATE TABLE candidate_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- responsesテーブル
CREATE TABLE responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  participant_name TEXT NOT NULL,
  edit_code TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id, participant_name)
);

-- availability_blocksテーブル
CREATE TABLE availability_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id UUID NOT NULL REFERENCES responses(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- インデックス
CREATE UNIQUE INDEX idx_events_url_slug ON events(url_slug);
CREATE INDEX idx_candidate_dates_event_id ON candidate_dates(event_id);
CREATE INDEX idx_responses_event_id ON responses(event_id);
CREATE INDEX idx_responses_name_code ON responses(event_id, participant_name, edit_code);
CREATE INDEX idx_availability_blocks_response_id ON availability_blocks(response_id);
CREATE INDEX idx_availability_blocks_date ON availability_blocks(date);
```

マイグレーション実行:
```bash
npx supabase db push
```

---

### 6. 型生成

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/supabase/types.ts
```

---

### 7. Tailwind設定

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        secondary: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7e22ce',
          800: '#6b21a8',
          900: '#581c87',
        },
      },
      fontSize: {
        'xs': '0.75rem',
        'sm': '0.875rem',
        'base': '1rem',
        'lg': '1.125rem',
        'xl': '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
      },
      borderRadius: {
        'lg': '8px',
      },
    },
  },
  plugins: [],
}

export default config
```

---

### 8. 開発サーバー起動

```bash
npm run dev
```

http://localhost:3000 でアクセス

---

### 9. Vercelデプロイ

```bash
# Vercel CLIインストール
npm i -g vercel

# ログイン
vercel login

# デプロイ
vercel

# 環境変数を設定
# Vercel Dashboard → Settings → Environment Variables
# NEXT_PUBLIC_SUPABASE_URL
# NEXT_PUBLIC_SUPABASE_ANON_KEY
```

---

## 実装の優先順位

### Phase 1: 基礎構築 ✅
1. 環境構築（Next.js + TypeScript + Tailwind）
2. Supabaseセットアップ
3. データベース作成（マイグレーション）
4. デザインシステム実装（Tailwind設定、コンポーネント）

### Phase 2: イベント作成機能
1. トップページ
2. イベント作成フォーム
3. API実装（POST /api/events）
4. 完了画面

### Phase 3: カレンダーUI
1. 基本的なカレンダー表示
2. ドラッグ選択機能
3. 横スクロール
4. 参加者数表示

### Phase 4: 回答機能
1. イベント詳細ページ
2. 回答画面
3. API実装（POST /api/events/[slug]/responses）
4. 確認モーダル

### Phase 5: 編集・集計機能
1. 編集画面
2. API実装（PUT /api/events/[slug]/responses）
3. 集計結果ページ
4. API実装（GET /api/events/[slug]/summary）

### Phase 6: 仕上げ
1. エラーハンドリング
2. ローディング表示
3. レスポンシブ対応の最終調整
4. テスト・デバッグ

---

## 今後の拡張案（オプション）

- [ ] 通知機能（メール/LINE）
- [ ] カレンダー連携（Google Calendar、Outlook）
- [ ] 投票機能（参加/不参加/未定）
- [ ] コメント機能
- [ ] テーマカラーのカスタマイズ
- [ ] 多言語対応
- [ ] PWA化（オフライン対応）
- [ ] ダークモード

---

## まとめ

**Awase** は、スマホでスムーズにスケジュール調整できる、シンプルで使いやすいWebアプリです。

**主な特徴:**
- ✅ ログイン不要
- ✅ Googleカレンダー風の直感的UI
- ✅ ドラッグで簡単に時間選択
- ✅ 30分単位の細かい調整
- ✅ 編集可能（名前+コード認証）
- ✅ リアルタイムで参加者数を確認

**技術スタック:**
- ✅ Next.js 14 (App Router) + TypeScript
- ✅ Tailwind CSS
- ✅ Supabase (PostgreSQL)
- ✅ Supabase Client（Prisma不使用）
- ✅ Zustand（状態管理）
- ✅ Vercel（デプロイ）

この要件定義書に基づいて、順次実装を進めていきます！

---

**バージョン:** 1.1  
**作成日:** 2025-11-02  
**最終更新:** 2025-11-03（Supabase Clientのみ使用に更新）
