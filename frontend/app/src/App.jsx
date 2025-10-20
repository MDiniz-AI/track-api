// src/App.jsx

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage'; // 1. Importe a nova página
import DashboardPage from './pages/DashboardPage';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const { isLoggedIn } = useAuth();

  return (
    <Router>
      <Routes>
        <Route path="/" element={ isLoggedIn ? <Navigate to="/dashboard" /> : <Navigate to="/login" /> } />
        <Route path="/login" element={ isLoggedIn ? <Navigate to="/dashboard" /> : <LoginPage /> } />
        
        {/* 2. Adicione a nova rota para a página de cadastro */}
        <Route path="/register" element={ isLoggedIn ? <Navigate to="/dashboard" /> : <RegisterPage /> } />
        
        <Route path="/dashboard" element={ <ProtectedRoute><DashboardPage /></ProtectedRoute> } />
      </Routes>
    </Router>
  );
}

export default App;