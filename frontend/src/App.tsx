import { Navigate, Route, Routes } from 'react-router-dom';
import type { ReactElement } from 'react';
import { useAuth } from './AuthContext';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';

function Protected({ children }: { children: ReactElement }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

function GuestOnly({ children }: { children: ReactElement }) {
  const { user } = useAuth();
  return user ? <Navigate to="/" replace /> : children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<GuestOnly><AuthPage /></GuestOnly>} />
      <Route path="/" element={<Protected><Dashboard /></Protected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
