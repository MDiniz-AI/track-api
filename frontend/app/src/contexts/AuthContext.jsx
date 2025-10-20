import { createContext, useState, useContext, useEffect } from 'react';

// 1. Cria o "molde" do nosso contexto
const AuthContext = createContext();

// 2. Cria o componente "Provedor" que vai abraçar nossa aplicação
export function AuthProvider({ children }) {
  // Guarda o token no estado. Começa como null.
  const [token, setToken] = useState(null);

  // Efeito que roda uma vez quando o app carrega
  useEffect(() => {
    // Tenta pegar um token que já estava salvo no armazenamento local do navegador
    const storedToken = localStorage.getItem('authToken');
    if (storedToken) {
      setToken(storedToken); // Se encontrou, coloca no nosso estado
    }
  }, []);

  // Função de Login: recebe o token, guarda no estado E no localStorage
  const login = (newToken) => {
    setToken(newToken);
    localStorage.setItem('authToken', newToken);
  };

  // Função de Logout: limpa o estado E o localStorage
  const logout = () => {
    setToken(null);
    localStorage.removeItem('authToken');
  };

  // O valor que será compartilhado com todos os componentes dentro do Provedor
  const value = {
    token,
    isLoggedIn: !!token, // Uma "mágica" para transformar o token em true/false
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// 3. Cria um "gancho" customizado para facilitar o uso do contexto
export function useAuth() {
  return useContext(AuthContext);
}