import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Navigate, useNavigate } from 'react-router-dom';

import api from '../../services/api'; 

import { ADMIN_CONFIG } from './adminDashboardConfig'; 
import GenericAdminTable from './genericTable.jsx';     
import AdminGenericFormModal from './genericFormModal.jsx';


const handleAddItem = async (itemData) => {
    const endpoint = currentConfig.endpoint;

    let dataToSend = { ...itemData };
    
    if (endpoint === 'users') {
        if (itemData.isAdmin) {
            dataToSend.role = 'admin';
        } else {
            dataToSend.role = 'user';
        }
        delete dataToSend.isAdmin;
    }

    try {
      if (editingItem) {
        const id = editingItem._id || editingItem.id;
        await api.patch(`/${endpoint}/${id}`, dataToSend); 
        alert(`${currentConfig.singular} atualizado com sucesso!`);
      } else {
        await api.post(`/${endpoint}`, dataToSend); 
        alert(`${currentConfig.singular} adicionado com sucesso!`);
      }
      
      handleCloseModal();
      setRefreshKey((prev) => prev + 1);

    } catch (error) {
      console.error('Erro:', error);
      const msg = error.response?.data?.message || error.message;
      alert(`Erro ao salvar: ${msg}`);
    }
  };

  
const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.user);
  
  const isAdmin = user?.role === 'admin'; 

  const tableOptions = Object.keys(ADMIN_CONFIG);
  const [selectedTable, setSelectedTable] = useState(tableOptions[0] || 'Songs');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [editingItem, setEditingItem] = useState(null); 

  useEffect(() => {
    if (user?.role !== 'admin') {
        navigate('/'); 
    }
  }, [user, navigate]);

  if (!isAdmin) return <Navigate to="/" replace />;

  const currentConfig = ADMIN_CONFIG[selectedTable];
  
  const handleAddItem = async (itemData) => {
    const endpoint = currentConfig.endpoint;
    
    let dataToSend = { ...itemData };

    if (selectedTable === 'Users' || endpoint === 'users') {
        
        if (dataToSend.isAdmin) {
            dataToSend.role = 'admin';
        } else {
            dataToSend.role = 'user';
        }

        delete dataToSend.isAdmin;
        
        if (dataToSend.username && !dataToSend.name) {
             dataToSend.name = dataToSend.username;
        }
    }

    console.log("Enviando dados para o servidor:", dataToSend); 

    try {
      if (editingItem) {
        const id = editingItem._id || editingItem.id;
        await api.patch(`/${endpoint}/${id}`, dataToSend);
        alert(`${currentConfig.singular} atualizado com sucesso!`);
      } else {
        await api.post(`/${endpoint}`, dataToSend);
        alert(`${currentConfig.singular} adicionado com sucesso!`);
      }

      handleCloseModal();
      setRefreshKey((prev) => prev + 1);

    } catch (error) {
      console.error('Erro:', error);
      const msg = error.response?.data?.message || error.message;
      alert(`Erro ao salvar: ${msg}`);
    }
  };

  const handleDeleteItem = async (id) => {
    const confirm = window.confirm('Tem certeza que deseja excluir este item?');
    if (!confirm) return;

    try {
      const endpoint = currentConfig.endpoint;
      
      await api.delete(`/${endpoint}/${id}`);

      setRefreshKey((prev) => prev + 1);
      alert(`${currentConfig.singular} excluído com sucesso!`);
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.message || error.message;
      alert(`Erro ao excluir: ${msg}`);
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

  const handleTableChange = (newTable) => {
    setSelectedTable(newTable);
    setSearchTerm(''); 
  };

    return (
        <div className="admin-dashboard">
            <h1 className="admin-header">
                Painel de Administração Moosica
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
                    initialData={editingItem} 
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