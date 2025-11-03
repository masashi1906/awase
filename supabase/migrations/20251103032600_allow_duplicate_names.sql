-- 同じイベント内で同じ名前の参加者を複数許可する
-- (例: 「田中」という名前の人が2人いる場合など)
--
-- 編集機能は response_id + participant_name + edit_code で認証しているため、
-- 名前が重複しても各responseのedit_codeはユニークなので問題なく動作します。
-- edit_codeは8文字 (a-z0-9) = 36^8 = 約2.8兆通りの組み合わせがあり、衝突確率はほぼゼロです。

-- UNIQUE制約を削除
ALTER TABLE responses DROP CONSTRAINT IF EXISTS responses_event_id_participant_name_key;
