
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './components/Dashboard';
import Login from './components/pages/Login';
import DashboardUser from './components/pages/DashboardUser';
import Roleta from './components/pages/Roleta';
import Perfil from './components/pages/Perfil';
import GerenciarUsuarios from './components/pages/GerenciarUsuarios';
import Navbar from './components/Navbar';

const PublicLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-black text-slate-200 font-sans">
    <Navbar />
    {children}
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes with Navbar */}
          <Route path="/" element={<PublicLayout><Dashboard /></PublicLayout>} />
          <Route path="/dashboard" element={<PublicLayout><DashboardUser /></PublicLayout>} />
          <Route path="/login" element={<Login />} />

          {/* Protected Routes with Navbar (Navbar inside component or layout wrapper if needed, 
              but Roleta/Perfil usually have their own structure or we should standardize) 
              Refactoring to wrap protected routes in PublicLayout as well for consistent Nav 
          */}
          <Route path="/roleta" element={<ProtectedRoute><PublicLayout><Roleta /></PublicLayout></ProtectedRoute>} />
          <Route path="/perfil" element={<ProtectedRoute><PublicLayout><Perfil /></PublicLayout></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><PublicLayout><GerenciarUsuarios /></PublicLayout></ProtectedRoute>} />
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
