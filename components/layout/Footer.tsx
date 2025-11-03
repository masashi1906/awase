/**
 * フッターコンポーネント
 * 全ページで共通して使用されるフッター
 */
export function Footer() {
  return (
    <footer className="border-t border-border bg-card mt-auto">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <p className="text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Awase. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
