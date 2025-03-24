import React, { useState, useEffect } from 'react';
import { Target, Plane, Wallet, Brain, Plus, Edit2, Trash2, X } from 'lucide-react';
import type { Meta } from './types';
import { supabase } from './lib/supabase';
import { Auth } from './components/Auth';
import { Session } from '@supabase/supabase-js';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [metas, setMetas] = useState<Meta[]>([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [metaEmEdicao, setMetaEmEdicao] = useState<Meta | null>(null);
  const [novaMetaForm, setNovaMetaForm] = useState<Partial<Meta>>({
    categoria: 'pessoal',
    progresso: 0
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        carregarMetas();
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        carregarMetas();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;

    const channel = supabase
      .channel('metas_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'metas',
          filter: `user_id=eq.${session.user.id}`,
        },
        (payload) => {
          console.log('Change received!', payload);
          carregarMetas();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session]);

  const carregarMetas = async () => {
    try {
      const { data, error } = await supabase
        .from('metas')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMetas(data || []);
    } catch (error) {
      console.error('Error loading metas:', error);
    }
  };

  const getCategoriaIcon = (categoria: Meta['categoria']) => {
    switch (categoria) {
      case 'financeiro':
        return <Wallet className="w-5 h-5 sm:w-6 sm:h-6" />;
      case 'viagem':
        return <Plane className="w-5 h-5 sm:w-6 sm:h-6" />;
      case 'pessoal':
        return <Brain className="w-5 h-5 sm:w-6 sm:h-6" />;
    }
  };

  const abrirModal = (meta?: Meta) => {
    if (meta) {
      setMetaEmEdicao(meta);
      setNovaMetaForm(meta);
    } else {
      setMetaEmEdicao(null);
      setNovaMetaForm({
        categoria: 'pessoal',
        progresso: 0,
        titulo: '',
        descricao: '',
        objetivo: 0,
        data_limite: new Date().toISOString().split('T')[0]
      });
    }
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setMetaEmEdicao(null);
    setNovaMetaForm({
      categoria: 'pessoal',
      progresso: 0
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNovaMetaForm(prev => ({
      ...prev,
      [name]: name === 'progresso' || name === 'objetivo' ? Number(value) : value
    }));
  };

  const salvarMeta = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session?.user?.id) return;

    try {
      const metaData = {
        ...novaMetaForm,
        user_id: session.user.id
      };

      if (metaEmEdicao) {
        const { error } = await supabase
          .from('metas')
          .update(metaData)
          .eq('id', metaEmEdicao.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('metas')
          .insert([metaData]);

        if (error) throw error;
      }

      fecharModal();
      await carregarMetas();
    } catch (error) {
      console.error('Error saving meta:', error);
      alert('Erro ao salvar a meta. Por favor, tente novamente.');
    }
  };

  const excluirMeta = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta meta?')) {
      try {
        const { error } = await supabase
          .from('metas')
          .delete()
          .eq('id', id);

        if (error) throw error;
        await carregarMetas();
      } catch (error) {
        console.error('Error deleting meta:', error);
        alert('Erro ao excluir a meta. Por favor, tente novamente.');
      }
    }
  };

  if (!session) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-3">
              <Target className="w-7 h-7 sm:w-8 sm:h-8 text-purple-600" />
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Metas Compartilhadas</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => abrirModal()}
                className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm sm:text-base"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Nova Meta</span>
              </button>
              <button
                onClick={() => supabase.auth.signOut()}
                className="text-gray-600 hover:text-gray-800 text-sm sm:text-base"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {metas.map((meta) => (
            <div key={meta.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    {getCategoriaIcon(meta.categoria)}
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900 line-clamp-1">{meta.titulo}</h2>
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => abrirModal(meta)}
                      className="text-gray-500 hover:text-gray-700 p-1"
                    >
                      <Edit2 className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                    <button 
                      onClick={() => excluirMeta(meta.id)}
                      className="text-gray-500 hover:text-red-600 p-1"
                    >
                      <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </div>
                </div>
                
                <p className="text-sm sm:text-base text-gray-600 mb-4 line-clamp-2">{meta.descricao}</p>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-xs sm:text-sm text-gray-600">
                    <span>Progresso</span>
                    <span>{Math.round((meta.progresso / meta.objetivo) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 sm:h-2.5">
                    <div
                      className="bg-purple-600 h-2 sm:h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${(meta.progresso / meta.objetivo) * 100}%` }}
                    ></div>
                  </div>
                  
                  {meta.categoria === 'financeiro' && (
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-gray-600">R$ {meta.progresso.toLocaleString('pt-BR')}</span>
                      <span className="text-gray-400">Meta: R$ {meta.objetivo.toLocaleString('pt-BR')}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between text-xs sm:text-sm text-gray-500 pt-2">
                    <span>Data limite:</span>
                    <span>{new Date(meta.data_limite).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {modalAberto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 sm:p-6 border-b sticky top-0 bg-white">
              <h2 className="text-lg sm:text-xl font-semibold">
                {metaEmEdicao ? 'Editar Meta' : 'Nova Meta'}
              </h2>
              <button onClick={fecharModal} className="text-gray-500 hover:text-gray-700 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={salvarMeta} className="p-4 sm:p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Título
                </label>
                <input
                  type="text"
                  name="titulo"
                  value={novaMetaForm.titulo || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm sm:text-base"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <textarea
                  name="descricao"
                  value={novaMetaForm.descricao || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm sm:text-base"
                  rows={3}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoria
                </label>
                <select
                  name="categoria"
                  value={novaMetaForm.categoria}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm sm:text-base"
                  required
                >
                  <option value="pessoal">Pessoal</option>
                  <option value="financeiro">Financeiro</option>
                  <option value="viagem">Viagem</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Progresso
                  </label>
                  <input
                    type="number"
                    name="progresso"
                    value={novaMetaForm.progresso || 0}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm sm:text-base"
                    required
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Objetivo
                  </label>
                  <input
                    type="number"
                    name="objetivo"
                    value={novaMetaForm.objetivo || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm sm:text-base"
                    required
                    min="1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data Limite
                </label>
                <input
                  type="date"
                  name="data_limite"
                  value={novaMetaForm.data_limite || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm sm:text-base"
                  required
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={fecharModal}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-sm sm:text-base"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm sm:text-base"
                >
                  {metaEmEdicao ? 'Salvar Alterações' : 'Criar Meta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;