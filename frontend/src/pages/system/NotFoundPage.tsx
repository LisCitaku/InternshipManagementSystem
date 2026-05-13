import { Link } from 'react-router-dom';
import { Button } from '@/components/Button';

export default function NotFoundPage() {
  return (
    <div className="grid min-h-[70vh] place-items-center">
      <div className="glass-panel max-w-lg rounded-lg p-8 text-center">
        <h1 className="text-3xl font-semibold">Page not found</h1>
        <p className="mt-3 text-sm text-ink-600 dark:text-ink-300">
          The route you opened does not exist in this workspace build.
        </p>
        <Button className="mt-6">
          <Link to="/">Go home</Link>
        </Button>
      </div>
    </div>
  );
}

