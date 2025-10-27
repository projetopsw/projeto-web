import React, { useEffect, useState, useMemo } from 'react';
import api from '../services/api';

const PlaylistsTable = ({ searchTerm }) => {
    const [playlists, setPlaylists] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/userPlaylists') 
            .then(response => {
                setPlaylists(response.data);
                setLoading(false);
            })
            .catch(error => {
                console.error("Erro ao buscar playlists:", error);
                setLoading(false);
            });
    }, []);

    const filteredPlaylists = useMemo(() => {
        if (!searchTerm) return playlists;
        const lowerCaseSearch = searchTerm.toLowerCase();

        return playlists.filter(playlist => 
            playlist.name?.toLowerCase().includes(lowerCaseSearch) ||
            playlist.creator?.toLowerCase().includes(lowerCaseSearch) ||
            playlist.description?.toLowerCase().includes(lowerCaseSearch) ||
            playlist.id?.toLowerCase().includes(lowerCaseSearch)
        );
    }, [playlists, searchTerm]);

    if (loading) return <div className="text-center py-4 text-lg">Carregando Playlists...</div>;

    return (
        <div className="overflow-x-auto">
            <table className="admin-table">
                <thead className="admin-table-head">
                    <tr>
                        <th>ID</th>
                        <th>Nome</th>
                        <th>Criador/Tipo</th>
                        <th>Músicas</th>
                        <th className="text-right">Ações</th>
                    </tr>
                </thead>
                <tbody className="admin-table-body">
                    {filteredPlaylists.map((playlist) => (
                        <tr key={playlist.id}>
                            <td>{playlist.id}</td>
                            <td>{playlist.name}</td>
                            <td>{playlist.creator || playlist.type || 'N/A'}</td>
                            <td>{playlist.songs ? playlist.songs.length : 0}</td>
                            <td className="text-right">
                                <button 
                                    onClick={() => console.log(`Ação: Editar Playlist ${playlist.id}`)}
                                    className="admin-action-button edit"
                                >
                                    Editar
                                </button>
                                <button 
                                    onClick={() => console.log(`Ação: Deletar Playlist ${playlist.id}`)}
                                    className="admin-action-button delete"
                                >
                                    Excluir
                                </button>
                            </td>
                        </tr>
                    ))}
                    {filteredPlaylists.length === 0 && !loading && (
                        <tr>
                            <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                                {searchTerm ? `Nenhuma playlist encontrada para "${searchTerm}".` : "Nenhuma playlist cadastrada."}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default PlaylistsTable;