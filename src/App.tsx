import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useSession } from './auth/useSession';
import Login from './auth/Login';
import Layout from './components/Layout';
import Followups from './pages/Followups';
import Pipeline from './pages/Pipeline';
import Icp from './pages/Icp';
import Settings from './pages/Settings';
import { Spinner } from './components/ui';

export default function App() {
  const { session, loading } = useSession();

  if (loading) {
    return (
      <div className="grid min-h-full place-items-center">
        <Spinner label="Loading…" />
      </div>
    );
  }

  if (!session) return <Login />;

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          {/* Follow-ups is the daily driver → default landing. */}
          <Route index element={<Navigate to="/followups" replace />} />
          <Route path="/followups" element={<Followups />} />
          <Route path="/pipeline" element={<Pipeline />} />
          <Route path="/icp" element={<Icp />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/followups" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
