import { Github } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-line mt-10">
      <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-ink-muted">
        <p>
          食事の詳細は
          <a
            href="https://www.asken.jp"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-ink-secondary"
          >
            「あすけん」アプリ
          </a>
          で確認できます
        </p>
        <a
          href="https://github.com/oXyut/diet-dashboard"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 hover:text-ink-secondary transition-colors"
        >
          <Github className="w-4 h-4" />
          <span>GitHub</span>
        </a>
      </div>
    </footer>
  );
}
