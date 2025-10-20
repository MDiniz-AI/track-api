import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Este componente recebe a página que ele deve proteger
function ProtectedRoute({ children }) {
  // Pergunta ao nosso cofre se o usuário está logado
  const { isLoggedIn } = useAuth(); 

  // Se não estiver logado...
  if (!isLoggedIn) {
    // ...manda ele de volta para a página de login.
    return <Navigate to="/login" replace />;
  }

  // Se estiver logado, permite que ele veja a página protegida.
  return children;
}

export default ProtectedRoute;