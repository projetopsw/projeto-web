import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

import { ADMIN_CONFIG } from './adminDashboardConfig'; 
import GenericAdminTable from './genericTable.jsx';     
import AdminGenericFormModal from './genericFormModal.jsx';


const AdminDashboard = () => {
  const isAdmin = useSelector((state) => state.auth.isAdmin);
  const tableOptions = Object.keys(ADMIN_CONFIG);
  const [selectedTable, setSelectedTable] = useState(tableOptions[0] || 'Songs');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [editingItem, setEditingItem] = useState(null); // Novo estado

  if (!isAdmin) return <Navigate to="/" replace />;

  const currentConfig = ADMIN_CONFIG[selectedTable];

  const handleAddItem = async (itemData) => {
    const method = editingItem ? 'PUT' : 'POST';
    const endpoint = currentConfig.endpoint;
    const apiUrl = editingItem
      ? `http://localhost:3001/${endpoint}/${editingItem.id}`
      : `http://localhost:3001/${endpoint}`;

    try {
      const response = await fetch(apiUrl, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemData),
      });

      if (!response.ok) throw new Error('Falha ao salvar o item');

      handleCloseModal();
      setRefreshKey((prev) => prev + 1);
      alert(
        `${currentConfig.singular} ${
          editingItem ? 'atualizado' : 'adicionado'
        } com sucesso!`
      );
    } catch (error) {
      console.error('Erro:', error);
      alert(`Erro: ${error.message}`);
    }
  };

  const handleDeleteItem = async (id) => {
    const confirm = window.confirm('Tem certeza que deseja excluir este item?');
    if (!confirm) return;

    try {
      const response = await fetch(`http://localhost:3001/${currentConfig.endpoint}/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Erro ao excluir item');

      setRefreshKey((prev) => prev + 1);
      alert(`${currentConfig.singular} excluído com sucesso!`);
    } catch (error) {
      console.error(error);
      alert(`Erro: ${error.message}`);
    }
  };

  const handleOpenModal = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingItem(null);
    setIsModalOpen(false);
  };

    return (
        <div className="admin-dashboard">
            <h1 className="admin-header">
                Painel de Administração Moosica 👑🐄
            </h1>

            <div className="admin-tabs-container">
                {tableOptions.map((tableKey) => (
                    <button
                        key={tableKey}
                        onClick={() => handleTableChange(tableKey)}
                        className={`admin-tab-button ${selectedTable === tableKey ? 'active' : ''}`}
                    >
                        {ADMIN_CONFIG[tableKey].plural} 
                    </button>
                ))}
            </div>

            <div className="admin-table-header">
                <h2 className="admin-management-title">
                    Gerenciamento de {currentConfig.plural}
                </h2>
                <input
                    type="text"
                    placeholder={`Buscar ${currentConfig.singular}...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="admin-search-input"
                />
                <button
                    onClick={handleOpenModal}
                    className="admin-add-button"
                >
                    + Adicionar Novo(a) {currentConfig.singular}
                </button>
            </div>

            <div className="admin-table-container">
                <GenericAdminTable
                    config={currentConfig}
                    searchTerm={searchTerm}
                    refreshKey={refreshKey}
                    onEdit={handleEditItem}
                    onDelete={handleDeleteItem}
                />
            </div>

            {isModalOpen && (
                <AdminGenericFormModal
                    config={currentConfig}
                    onClose={handleCloseModal}
                    onSubmit={handleAddItem}
                    initialData={editingItem} // preenche se estiver editando
                    title={
                        editingItem
                        ? `Editar ${currentConfig.singular}`
                        : `Adicionar Novo(a) ${currentConfig.singular}`
                    }
                />
            )}
        </div>
    );
};

export default AdminDashboard;