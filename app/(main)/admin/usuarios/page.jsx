// Em app/(main)/admin/usuarios/page.jsx

"use client";

import { useState, useEffect } from 'react';
import { FaTrash, FaPlus, FaUpload, FaUsers } from 'react-icons/fa';
import { format } from 'date-fns';
import Papa from 'papaparse';
import EmptyState from '@/components/EmptyState';

export default function AdminUsuariosPage() {
  // Estados para o formulário de novo usuário
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Estados da UI e dados da lista de usuários
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');

  // Estados para a funcionalidade de Backup/Restauração
  const [backupPassword, setBackupPassword] = useState('');
  const [restorePassword, setRestorePassword] = useState('');
  const [restoreFile, setRestoreFile] = useState(null);
  const [feedback, setFeedback] = useState({ message: '', type: '' });
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/usuarios');
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Falha ao buscar usuários');
      setUsers(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleAddUser = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role: 'member' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Falha ao criar usuário');
      
      setName(''); setEmail(''); setPassword('');
      fetchUsers();
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Tem certeza que deseja excluir este usuário?')) return;
    try {
      const res = await fetch(`/api/usuarios?id=${userId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Falha ao excluir usuário');
      setUsers(users.filter(u => u._id !== userId));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleExport = async () => {
    if (!backupPassword) {
      setFeedback({ message: 'Por favor, digite sua senha para exportar.', type: 'error' });
      return;
    }
    setIsProcessing(true);
    setFeedback({ message: '', type: '' });
    try {
      const res = await fetch('/api/backup/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: backupPassword }),
      });
      const data = await res.json(); // A resposta será { success: true, data: '...' }
      if (!res.ok) throw new Error(data.message || 'Falha ao exportar');

      // Cria e baixa o arquivo de texto com o conteúdo criptografado
      const blob = new Blob([data.data], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-gestor-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setFeedback({ message: 'Exportação concluída com sucesso!', type: 'success' });
    } catch (err) {
      setFeedback({ message: err.message, type: 'error' });
    } finally {
      setIsProcessing(false);
      setBackupPassword('');
    }
  };

  const handleImport = async () => {
    if (!restoreFile || !restorePassword) {
      setFeedback({ message: 'Por favor, selecione um arquivo e digite sua senha.', type: 'error' });
      return;
    }
    if (!window.confirm('ATENÇÃO! Esta ação irá APAGAR TODOS os seus dados atuais (rendas, despesas, contas, etc.) e substituí-los pelos dados do backup. Esta ação não pode ser desfeita. Deseja continuar?')) {
      return;
    }
    
    setIsProcessing(true);
    setFeedback({ message: '', type: '' });
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      const fileContent = e.target.result;
      try {
        const res = await fetch('/api/backup/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: restorePassword, fileContent }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Falha ao importar');
        setFeedback({ message: data.message + ' A página será recarregada.', type: 'success' });
        setTimeout(() => window.location.reload(), 2000);
      } catch (err) {
        setFeedback({ message: err.message, type: 'error' });
      } finally {
        setIsProcessing(false);
        setRestorePassword('');
        setRestoreFile(null);
        document.getElementById('restoreFile').value = '';
      }
    };
    reader.readAsText(restoreFile);
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Painel de Administração</h1>
      <p className="mt-2 text-gray-600 dark:text-gray-400">Gerenciamento de membros e dados da aplicação.</p>

      {/* Formulário de Cadastro */}
      <div className="p-6 mt-8 bg-white rounded-lg shadow-md dark:bg-gray-800">
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200">Adicionar Novo Membro</h2>
        <form onSubmit={handleAddUser} className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <input type="text" placeholder="Nome" value={name} onChange={e => setName(e.target.value)} required className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 focus:ring-purple-500 focus:border-purple-500" />
            <input type="email" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} required className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 focus:ring-purple-500 focus:border-purple-500" />
            <input type="password" placeholder="Senha Temporária" value={password} onChange={e => setPassword(e.target.value)} required className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 focus:ring-purple-500 focus:border-purple-500" />
          </div>
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <div className="flex justify-end">
            <button type="submit" className="inline-flex items-center px-4 py-2 font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700">
              <FaPlus className="mr-2" /> Adicionar
            </button>
          </div>
        </form>
      </div>

      {/* Lista de Usuários */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200">Membros Cadastrados</h2>
        <div className="mt-4">
          {isLoading ? ( <p className="text-center text-gray-500 dark:text-gray-400">Carregando usuários...</p> ) : 
           error ? ( <p className="text-center text-red-500">{error}</p> ) : 
           users.length > 0 ? (
            <div className="overflow-x-auto bg-white rounded-lg shadow dark:bg-gray-800">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">Nome</th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">E-mail</th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">Membro Desde</th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase dark:text-gray-400">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                  {users.map(user => (
                    <tr key={user._id}>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">{user.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{user.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{format(new Date(user.createdAt), 'dd/MM/yyyy')}</td>
                      <td className="px-6 py-4 text-sm text-right">
                        <button onClick={() => handleDeleteUser(user._id)} className="p-2 text-gray-500 rounded-full dark:text-gray-400 hover:bg-red-100 hover:text-red-600 dark:hover:bg-gray-700 dark:hover:text-red-400" title="Excluir usuário"><FaTrash /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
           ) : (
            <EmptyState
              icon={<FaUsers size={32} />}
              title="Nenhum Membro Cadastrado"
              message="Use o formulário acima para adicionar o primeiro membro da família à plataforma."
            />
           )}
        </div>
      </div>

      {/* Seção de Backup e Restauração */}
      <div className="p-6 mt-8 bg-white border-t-4 border-yellow-400 rounded-b-lg shadow-md dark:bg-gray-800 dark:border-yellow-500">
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200">Backup e Restauração</h2>
        <div className="mt-4">
          <h3 className="font-medium text-gray-800 dark:text-gray-100">Exportar Dados Criptografados</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Gere um arquivo seguro com todos os seus dados.</p>
          <div className="flex flex-col gap-2 mt-2 sm:flex-row sm:gap-4">
            <input type="password" value={backupPassword} onChange={e => setBackupPassword(e.target.value)} placeholder="Confirme sua senha de admin" className="flex-grow input-form" />
            <button onClick={handleExport} disabled={isProcessing} className="px-4 py-2 font-medium text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700 disabled:bg-blue-400">
              {isProcessing ? 'Processando...' : 'Exportar'}
            </button>
          </div>
        </div>
        
        <div className="pt-4 mt-6 border-t border-gray-200 dark:border-gray-700">
          <h3 className="font-medium text-red-700 dark:text-red-400">Restaurar Dados (Ação Perigosa)</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Substitua todos os dados atuais por um arquivo de backup.</p>
          <div className="mt-2 space-y-4">
            <input type="file" id="restoreFile" accept=".txt" onChange={e => setRestoreFile(e.target.files?.[0] || null)} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100 dark:text-gray-300 dark:file:bg-gray-600 dark:file:text-gray-200 dark:hover:file:bg-gray-500" />
            <input type="password" value={restorePassword} onChange={e => setRestorePassword(e.target.value)} placeholder="Digite a senha do backup" className="w-full input-form" />
            <button onClick={handleImport} disabled={isProcessing} className="w-full px-4 py-2 font-medium text-white bg-red-600 rounded-md shadow-sm hover:bg-red-700 disabled:bg-red-400">
              {isProcessing ? 'Processando...' : 'Restaurar Backup'}
            </button>
          </div>
        </div>

        {feedback.message && (
          <p className={`mt-4 text-sm text-center font-semibold ${feedback.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
            {feedback.message}
          </p>
        )}
      </div>
    </div>
  );
}
