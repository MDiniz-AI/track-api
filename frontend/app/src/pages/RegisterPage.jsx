// src/pages/RegisterPage.jsx

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Cadastro realizado com sucesso! Agora você pode fazer o login.');
        navigate('/login');
      } else {
        setError(data.message || 'Ocorreu um erro no cadastro.');
      }
    } catch (err) {
      setError('Não foi possível conectar ao servidor.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="bg-slate-800 p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-3xl font-bold text-white text-center mb-6">
          Criar Nova Conta
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-500/20 p-3 rounded-md text-center text-red-400">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-300">E-mail</label>
            <input 
              id="email" 
              type="email" 
              required 
              className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500" 
              placeholder="seu-email@exemplo.com" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-300">Senha</label>
            <input 
              id="password" 
              type="password" 
              required 
              className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500" 
              placeholder="••••••••" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300">Confirmar Senha</label>
            <input 
              id="confirmPassword" 
              type="password" 
              required 
              className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500" 
              placeholder="••••••••" 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
            />
          </div>

          <div>
            <button 
              type="submit" 
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-cyan-500 transition-colors"
            >
              Cadastrar
            </button>
          </div>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Já tem uma conta?{' '}
          <Link to="/login" className="font-medium text-cyan-400 hover:text-cyan-300">
            Faça o login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;