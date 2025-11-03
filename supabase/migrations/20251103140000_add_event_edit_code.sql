-- イベント編集コードを追加
-- イベント作成者がイベント情報（タイトル、説明、候補日）を編集できるようにする

-- event_edit_code カラムを追加
ALTER TABLE events ADD COLUMN event_edit_code TEXT;

-- 既存のイベントにランダムな8桁の編集コードを生成して設定
-- (a-z0-9) = 36文字から8桁 = 36^8 = 約2.8兆通りの組み合わせ
UPDATE events
SET event_edit_code =
  substr(md5(random()::text || id::text), 1, 8)
WHERE event_edit_code IS NULL;

-- NOT NULL制約を追加
ALTER TABLE events ALTER COLUMN event_edit_code SET NOT NULL;

-- インデックスを追加（url_slug + event_edit_code での検索を高速化）
CREATE INDEX idx_events_slug_code ON events(url_slug, event_edit_code);
