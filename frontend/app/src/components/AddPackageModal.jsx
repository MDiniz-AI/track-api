// src/components/AddPackageModal.jsx

import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

function AddPackageModal({ isOpen, closeModal, onPackageSaved, editingPackage }) {
  const [mode, setMode] = useState('ia');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [extractedData, setExtractedData] = useState(null);
  const [formData, setFormData] = useState({ title: '', tracking_code: '', carrier: '', store_name: '' });

  const { token } = useAuth();

  useEffect(() => {
    if (editingPackage) {
      setFormData({
        title: editingPackage.title || '',
        tracking_code: editingPackage.tracking_code || '',
        carrier: editingPackage.carrier || '',
        store_name: editingPackage.store_name || '',
      });
      setMode('manual');
    } else if (extractedData) {
      setFormData({
        title: extractedData.title || '',
        tracking_code: extractedData.tracking_code || '',
        carrier: extractedData.carrier || '',
        store_name: extractedData.store_name || '',
      });
    } else {
      setFormData({ title: '', tracking_code: '', carrier: '', store_name: '' });
    }
  }, [editingPackage, extractedData]);

  const handleFileChange = (event) => { setSelectedFile(event.target.files[0]); };

  const handleProcessImage = async (event) => {
    event.preventDefault();
    if (!selectedFile) { setError('Por favor, selecione um arquivo de imagem.'); return; }
    setIsLoading(true); setError(null); setExtractedData(null);
    const formData = new FormData();
    formData.append('image', selectedFile);
    try {
      const response = await fetch('http://localhost:3000/packages/ocr', {
        method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: formData,
      });
      const data = await response.json();
      if (response.ok) { setExtractedData(data); } else { setError(data.message || 'Ocorreu um erro.'); }
    } catch (err) { setError('Falha na comunicação.'); } finally { setIsLoading(false); }
  };

  const handleSavePackage = async (event) => {
    event.preventDefault();
    setIsLoading(true); setError(null);

    const isEditing = !!editingPackage;
    const url = isEditing ? `http://localhost:3000/packages/${editingPackage.id}` : 'http://localhost:3000/packages';
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (response.ok) { onPackageSaved(); } else { setError(data.message || 'Ocorreu um erro ao salvar.'); }
    } catch (err) { setError('Falha na comunicação.'); } finally { setIsLoading(false); }
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormData(prevData => ({ ...prevData, [name]: value }));
  };

  const handleClose = () => {
    setSelectedFile(null); setExtractedData(null); setError(null); setMode('ia');
    closeModal();
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={handleClose}>
        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-black/60" />
        </Transition.Child>
        <div className="fixed inset-0 overflow-y-auto"><div className="flex min-h-full items-center justify-center p-4 text-center">
        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
          <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-slate-800 p-6 text-left align-middle shadow-xl transition-all">
            <Dialog.Title as="h3" className="text-2xl font-bold leading-6 text-cyan-400 mb-4">
              {editingPackage ? 'Editar Pacote' : (mode === 'ia' && !extractedData ? 'Adicionar com Imagem' : 'Detalhes do Pacote')}
            </Dialog.Title>
            
            {(mode === 'ia' && !extractedData && !editingPackage) ? (
              <form onSubmit={handleProcessImage}>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-slate-300">Selecione o print do seu pedido</label>
                  <input type="file" accept="image/*" onChange={handleFileChange} className="mt-1 block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-cyan-50 file:text-cyan-700 hover:file:bg-cyan-100"/>
                </div>
                {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
                <div className="mt-6 flex justify-between items-center">
                  <div>
                    <button type="submit" disabled={isLoading || !selectedFile} className="inline-flex justify-center rounded-md border border-transparent bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-700 disabled:bg-slate-500">
                      {isLoading ? 'Analisando...' : 'Analisar Imagem'}
                    </button>
                    <button type="button" onClick={handleClose} className="ml-4 text-sm text-slate-400 hover:text-white">Cancelar</button>
                  </div>
                  <button type="button" onClick={() => setMode('manual')} className="text-sm text-cyan-400 hover:underline">Adicionar manualmente</button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSavePackage} className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-slate-300">Título</label>
                  <input id="title" name="title" type="text" value={formData.title} onChange={handleFormChange} required className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white"/>
                </div>
                <div>
                  <label htmlFor="tracking_code" className="block text-sm font-medium text-slate-300">Cód. Rastreio</label>
                  <input id="tracking_code" name="tracking_code" type="text" value={formData.tracking_code} onChange={handleFormChange} required className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white"/>
                </div>
                <div>
                  <label htmlFor="carrier" className="block text-sm font-medium text-slate-300">Transportadora</label>
                  <input id="carrier" name="carrier" type="text" value={formData.carrier} onChange={handleFormChange} className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white"/>
                </div>
                <div>
                  <label htmlFor="store_name" className="block text-sm font-medium text-slate-300">Loja</label>
                  <input id="store_name" name="store_name" type="text" value={formData.store_name} onChange={handleFormChange} className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white"/>
                </div>
                {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
                <div className="mt-6 flex justify-between items-center">
                  {(mode === 'ia' && !editingPackage) ? (
                    <button type="button" onClick={() => setExtractedData(null)} className="text-sm text-slate-400 hover:text-white">Voltar</button>
                  ) : <div />}
                  <div>
                    <button type="submit" disabled={isLoading} className="inline-flex justify-center rounded-md border border-transparent bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-700 disabled:bg-slate-500">
                      {isLoading ? 'Salvando...' : 'Salvar Pacote'}
                    </button>
                    <button type="button" onClick={handleClose} className="ml-4 text-sm text-slate-400 hover:text-white">Cancelar</button>
                  </div>
                </div>
              </form>
            )}
          </Dialog.Panel>
        </Transition.Child>
        </div></div>
      </Dialog>
    </Transition>
  );
}

export default AddPackageModal;