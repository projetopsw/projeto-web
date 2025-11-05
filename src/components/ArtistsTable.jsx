import React, { useEffect, useState, useMemo } from 'react';
import api from '../services/api';

const ArtistsTable = ({ searchTerm }) => {
    const [artists, setArtists] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/topArtists')
            .then(response => {
                setArtists(response.data);
                setLoading(false);
            })
            .catch(error => {
                console.error("Erro ao buscar artistas:", error);
                setLoading(false);
            });
    }, []);

    const filteredArtists = useMemo(() => {
        if (!searchTerm) return artists;
        const lowerCaseSearch = searchTerm.toLowerCase();

        return artists.filter(artist => 
            artist.name?.toLowerCase().includes(lowerCaseSearch) ||
            artist.genre?.toLowerCase().includes(lowerCaseSearch) ||
            artist.id?.toLowerCase().includes(lowerCaseSearch)
        );
    }, [artists, searchTerm]);

    if (loading) return <div className="text-center py-4 text-lg">Carregando Artistas...</div>;

    return (
        <div className="overflow-x-auto">
            <table className="admin-table">
                <thead className="admin-table-head">
                    <tr>
                        <th>ID</th>
                        <th>Nome</th>
                        <th>Gênero</th>
                        <th className="text-right">Ações</th>
                    </tr>
                </thead>
                <tbody className="admin-table-body">
                    {filteredArtists.map((artist) => (
                        <tr key={artist.id}>
                            <td>{artist.id}</td>
                            <td>{artist.name}</td>
                            <td>{artist.genre}</td>
                            <td className="text-right">
                                <button 
                                    onClick={() => console.log(`Ação: Editar Artista ${artist.id}`)}
                                    className="admin-action-button edit"
                                >
                                    Editar
                                </button>
                                <button 
                                    onClick={() => console.log(`Ação: Deletar Artista ${artist.id}`)}
                                    className="admin-action-button delete"
                                >
                                    Excluir
                                </button>
                            </td>
                        </tr>
                    ))}
                    {filteredArtists.length === 0 && !loading && (
                        <tr>
                            <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                                {searchTerm ? `Nenhum artista encontrado para "${searchTerm}".` : "Nenhum artista cadastrado."}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default ArtistsTable;