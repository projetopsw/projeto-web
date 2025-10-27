import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
// import './Admin.css'; // Não esqueça de importar o CSS no seu arquivo AdminDashboard.jsx

import UsersTable from '../../components/UsersTable'; 
import SongsTable from '../../components/SongsTable'; 
import ArtistsTable from '../../components/ArtistsTable';
import AlbumsTable from '../../components/AlbumsTable';
import PlaylistsTable from '../../components/PlaylistsTable';
import GroupsTable from '../../components/GroupsTable';

const AdminDashboard = () => {
    const isAdmin = useSelector((state) => state.auth.isAdmin);
    const [selectedTable, setSelectedTable] = useState('Songs'); 
    const [searchTerm, setSearchTerm] = useState(''); 

    // Limpa o termo de busca quando a tabela muda
    const handleTableChange = (newTable) => {
        setSelectedTable(newTable);
        setSearchTerm(''); 
    };


    const tableOptions = ['Songs', 'Artists', 'Albums', 'Users', 'Playlists', 'Groups'];

    const renderTable = () => {
        switch (selectedTable) {
            case 'Users':
                return <UsersTable searchTerm={searchTerm} />;
            case 'Songs':
                return <SongsTable searchTerm={searchTerm} />;
            case 'Artists':
                return <ArtistsTable searchTerm={searchTerm} />;
            case 'Albums':
                return <AlbumsTable searchTerm={searchTerm} />;
            case 'Groups':
                return <GroupsTable searchTerm={searchTerm} />;
            case 'Playlists':
                return <PlaylistsTable searchTerm={searchTerm} />;
            default:
                return <div>Selecione uma tabela para gerenciar.</div>;
        }
    };

    const getSingularName = (plural) => {
        if (plural === 'Users') return 'Usuário';
        if (plural === 'Albums') return 'Álbum';
        if (plural === 'Playlists') return 'Playlist';
        if (plural === 'Songs') return 'Música';
        if (plural === 'Artists') return 'Artista';
        if (plural === 'Groups') return 'Grupo';
        return 'Item';
    };

    return (
        <div className="admin-dashboard">
            {/* Título Principal */}
            <h1 className="admin-header">
                Painel de Administração Moosica 👑
            </h1>

            {/* Navegação da Tabela (Tabs) */}
            <div className="admin-tabs-container">
                {tableOptions.map((table) => (
                    <button
                        key={table}
                        onClick={() => handleTableChange(table)}
                        className={`admin-tab-button ${selectedTable === table ? 'active' : ''}`}
                    >
                        {table}
                    </button>
                ))}
            </div>

            {/* Cabeçalho, Busca e Botão Adicionar */}
            <div className="admin-table-header">
                <h2 className="admin-management-title">
                    Gerenciamento de {selectedTable}
                </h2>
                <input
                    type="text"
                    placeholder={`Buscar ${getSingularName(selectedTable)}...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="admin-search-input"
                />
                <button 
                    onClick={() => console.log(`Ação: Adicionar Novo ${getSingularName(selectedTable)}`)}
                    className="admin-add-button"
                >
                    + Adicionar Novo(a) {getSingularName(selectedTable)}
                </button>
            </div>

            {/* Container da Tabela */}
            <div className="admin-table-container">
                {renderTable()}
            </div>
        </div>
    );
};

export default AdminDashboard;