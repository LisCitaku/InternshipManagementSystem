import { Link } from 'react-router-dom';
import { Button } from '@/components/Button';

export default function UnauthorizedPage() {
  return (
    <div className="grid min-h-[70vh] place-items-center">
      <div className="glass-panel max-w-lg rounded-lg p-8 text-center">
        <h1 className="text-3xl font-semibold">Access denied</h1>
        <p className="mt-3 text-sm text-ink-600 dark:text-ink-300">
          Your current role does not have access to this area. Head back to a workspace you can use.
        </p>
        <Button className="mt-6">
          <Link to="/">Return home</Link>
        </Button>
      </div>
    </div>
  );
}

