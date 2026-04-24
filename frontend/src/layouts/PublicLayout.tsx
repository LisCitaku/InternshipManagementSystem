import { Outlet } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { ThemeToggle } from '@/components/ThemeToggle';
import { StudentHelperBot } from '@/components/StudentHelperBot';

export function PublicLayout() {
  return (
    <div className="page-shell">
      <div className="mx-auto flex min-h-screen max-w-[1320px] flex-col px-4 py-5 sm:px-6 lg:px-8">
        <header className="mb-8 flex items-center justify-between rounded-lg border border-white/10 bg-[#0d1727]/88 px-5 py-4 text-white shadow-[0_20px_60px_-28px_rgba(0,0,0,0.75)] backdrop-blur-xl">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-500">Internship Hub</div>
            <div className="text-lg font-semibold text-white">Career operations for students and teams</div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-xl border border-sky-400/20 bg-sky-400/12 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-400/18 hover:translate-y-[-1px]"
            >
              Log in
            </Link>
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
      <StudentHelperBot />
    </div>
  );
}
