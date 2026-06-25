import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import ErrorBoundary from '@/components/ErrorBoundary';
import Layout from '@/components/Layout';
import Login from '@/pages/Login';
import ResetPassword from '@/pages/ResetPassword';
import Dashboard from '@/pages/Dashboard';
import Clientes from '@/pages/Clientes';
import ClienteDetail from '@/pages/ClienteDetail';
import SeanceDetail from '@/pages/SeanceDetail';
import Miroirs from '@/pages/Miroirs';
import Mediatheque from '@/pages/Mediatheque';
import Produits from '@/pages/Produits';
import ExportPage from '@/pages/ExportPage';
import Equipe from '@/pages/Equipe';
import Boutiques from '@/pages/Boutiques';
import RgpdPage from '@/pages/RgpdPage';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center"><div className="text-gray-400">Chargement…</div></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route
          path="/*"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="clients" element={<Clientes />} />
          <Route path="clients/:id" element={<ClienteDetail />} />
          <Route path="seances/:id" element={<SeanceDetail />} />
          <Route path="miroirs" element={<Miroirs />} />
          <Route path="mediatheque" element={<Mediatheque />} />
          <Route path="produits" element={<Produits />} />
          <Route path="export" element={<ExportPage />} />
          <Route path="equipe" element={<Equipe />} />
          <Route path="boutiques" element={<Boutiques />} />
          <Route path="rgpd" element={<RgpdPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </ErrorBoundary>
  );
}
