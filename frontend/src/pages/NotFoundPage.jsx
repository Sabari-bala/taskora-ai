import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-paper-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-paper-150 flex items-center justify-center mb-6">
          <Compass size={26} className="text-ink-500" />
        </div>
        <p className="text-overline text-ink-500 mb-2">ERROR 404</p>
        <h1 className="text-h1 font-semibold text-ink-900">
          This page doesn&apos;t exist
        </h1>
        <p className="mt-3 text-body-lg text-ink-600">
          The link may be broken, or the page may have been moved.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center h-10 px-5 rounded-md bg-signal-500 text-white text-body font-medium hover:bg-signal-600 transition-colors"
          >
            Go to Dashboard
          </Link>
          <Link
            to="/projects"
            className="inline-flex items-center h-10 px-5 rounded-md border border-paper-300 text-ink-800 text-body font-medium hover:bg-paper-150 transition-colors"
          >
            View Projects
          </Link>
        </div>
      </div>
    </div>
  );
}
