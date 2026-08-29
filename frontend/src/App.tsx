import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ComingSoon } from './pages/ComingSoon';

function App() {
  return (
    <Routes>
      {/* Layout wraps every page with the header nav. Nested <Route>s render
          inside its <Outlet />. */}
      <Route element={<Layout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/pricing" element={<ComingSoon title="Pricing" />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <ComingSoon title="Dashboard" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tutor"
          element={
            <ProtectedRoute>
              <ComingSoon title="AI Tutor" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/topics"
          element={
            <ProtectedRoute>
              <ComingSoon title="Math Topics" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/papers"
          element={
            <ProtectedRoute>
              <ComingSoon title="Past Papers" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/resources"
          element={
            <ProtectedRoute>
              <ComingSoon title="Resources" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/account"
          element={
            <ProtectedRoute>
              <ComingSoon title="Account" />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  );
}

export default App;
