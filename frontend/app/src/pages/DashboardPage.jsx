// src/pages/DashboardPage.jsx

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import AddPackageModal from '../components/AddPackageModal';
import PackageCard from '../components/PackageCard';

function DashboardPage() {
  const { token, logout } = useAuth();
  const [packages, setPackages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);

  const fetchPackages = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:3000/packages', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) { throw new Error('Falha ao buscar os pacotes.'); }
      const data = await response.json();
      setPackages(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchPackages();
    }
  }, [token, fetchPackages]);

  const handleEditPackage = (pkg) => {
    setEditingPackage(pkg);
    setIsModalOpen(true);
  };

  const handleAddPackage = () => {
    setEditingPackage(null);
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const handleDeletePackage = async (packageId) => {
    try {
      const response = await fetch(`http://localhost:3000/packages/${packageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Falha ao deletar o pacote.');
      }

      // Se deu certo, simplesmente buscamos a lista de pacotes novamente.
      // A forma mais simples e segura de atualizar a tela!
      fetchPackages(); 

    } catch (err) {
      console.error(err);
      // Opcional: mostrar uma mensagem de erro para o usuário
      setError(err.message);
    }
  };

  const handlePackageSaved = () => {
    closeModal();
    fetchPackages();
  };

  return (
    <>
      <div className="min-h-screen bg-slate-900 text-white p-8">
        <div className="max-w-4xl mx-auto">
          <header className="flex justify-between items-center mb-12">
            <h1 className="text-4xl font-bold text-white">Minhas Entregas</h1>
            <div className="flex items-center gap-4">
              <button onClick={handleAddPackage} className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-lg transition-transform hover:scale-105">
                + Adicionar Pacote
              </button>
              <button onClick={logout} className="bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold py-2 px-4 rounded-lg">
                Sair
              </button>
            </div>
          </header>
          
          <main>
            {isLoading && <p className="text-center text-slate-400">Carregando pacotes...</p>}
            {error && <p className="text-center text-red-400">Erro: {error}</p>}
            {!isLoading && !error && packages.length === 0 && (
              <div className="text-center bg-slate-800 p-8 rounded-lg">
                <h2 className="text-2xl font-semibold text-white">Nenhum pacote encontrado</h2>
                <p className="text-slate-400 mt-2">Clique em "Adicionar Pacote" para começar a rastrear suas entregas!</p>
              </div>
            )}
            {!isLoading && !error && packages.length > 0 && (
              <div className="space-y-4">
                {packages.map(pkg => (
                  <PackageCard 
                    key={pkg.id} 
                    package={pkg}
                    onEdit={handleEditPackage}
                    onDelete={handleDeletePackage}
                  />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      <AddPackageModal 
        isOpen={isModalOpen} 
        closeModal={closeModal} 
        onPackageSaved={handlePackageSaved}
        editingPackage={editingPackage}
      />
    </>
  );
}

export default DashboardPage;