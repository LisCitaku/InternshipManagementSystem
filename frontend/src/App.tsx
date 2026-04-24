import { Suspense } from 'react';
import { AppRoutes } from './routes/AppRoutes';
import { Loader } from './components/Loader';

export default function App() {
  return (
    <Suspense fallback={<Loader fullScreen label="Loading workspace" />}>
      <AppRoutes />
    </Suspense>
  );
}

