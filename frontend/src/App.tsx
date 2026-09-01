import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminRoute } from './components/AdminRoute';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Admin } from './pages/Admin';
import { Dashboard } from './pages/Dashboard';
import { Tutor } from './pages/Tutor';
import { Topics } from './pages/Topics';
import { ComingSoon } from './pages/ComingSoon';
import { Pricing } from './pages/Pricing';
import { Account } from './pages/Account';
import { Papers } from './pages/Papers';
import { Resources } from './pages/Resources';

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/pricing" element={<Pricing />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tutor/:conversationId?"
          element={
            <ProtectedRoute>
              <Tutor />
            </ProtectedRoute>
          }
        />
        <Route
          path="/topics"
          element={
            <ProtectedRoute>
              <Topics />
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
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <Admin />
            </AdminRoute>
          }
        />
        <Route
            path="/account"
            element={
              <ProtectedRoute>
                <Account />
              </ProtectedRoute>
            }
        />
        <Route
            path="/papers"
            element={
                <ProtectedRoute>
                    <Papers />
                </ProtectedRoute>
            }
        />
        <Route
            path="/resources"
            element={
              <ProtectedRoute>
                <Resources />
              </ProtectedRoute>
            }
          />
      </Route>
    </Routes>
  );
}

export default App;