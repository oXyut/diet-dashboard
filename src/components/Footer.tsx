import { Github, Calendar } from 'lucide-react';

const updates = [
  {
    date: '2025-07-28',
    title: 'あすけんアプリ連携情報追加',
    description: '食事の詳細情報を「あすけん」アプリで確認できることを明記'
  },
  {
    date: '2025-07-28',
    title: 'PFC栄養素トラッキング機能',
    description: 'タンパク質・脂質・炭水化物の記録と摂取カロリー自動計算機能を追加'
  },
  {
    date: '2025-07-26',
    title: 'クリーンアーキテクチャ導入',
    description: 'リポジトリパターンによるデータアクセス層の抽象化'
  },
  {
    date: '2025-07-25',
    title: 'Supabaseデータベース連携',
    description: 'クラウドデータベースによる永続化とAPI認証機能'
  }
];

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-12">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* 開発情報 */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">開発情報</h3>
            <div className="space-y-3">
              <a
                href="https://github.com/oXyut/diet-dashboard"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <Github className="w-5 h-5" />
                <span>GitHubリポジトリ</span>
              </a>
              <p className="text-sm text-gray-500">
                バグ報告や機能要望はGitHubのIssuesまでお願いします。
              </p>
            </div>
          </div>

          {/* 最新のアップデート */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">最新のアップデート</h3>
            <div className="space-y-3">
              {updates.slice(0, 3).map((update, index) => (
                <div key={index} className="border-l-2 border-gray-200 pl-4">
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                    <Calendar className="w-4 h-4" />
                    <time>{update.date}</time>
                  </div>
                  <h4 className="font-medium text-gray-900">{update.title}</h4>
                  <p className="text-sm text-gray-600">{update.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* コピーライト */}
        <div className="mt-8 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} Diet Dashboard. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}