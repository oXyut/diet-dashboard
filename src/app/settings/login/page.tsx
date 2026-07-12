import SettingsLogin from '@/components/SettingsLogin';

export default function SettingsLoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-4">
      <section className="w-full rounded-xl border border-line bg-surface p-6">
        <h1 className="text-xl font-bold text-ink">目標設定</h1>
        <p className="mt-2 mb-6 text-sm text-ink-muted">管理パスワードを入力してください。</p>
        <SettingsLogin />
      </section>
    </main>
  );
}
