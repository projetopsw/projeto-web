import React, { useEffect, useState, useMemo } from 'react';
import api from '../services/api';

const AlbumsTable = ({ searchTerm }) => {
    const [albums, setAlbums] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/topAlbums')
            .then(response => {
                setAlbums(response.data);
                setLoading(false);
            })
            .catch(error => {
                console.error("Erro ao buscar álbuns:", error);
                setLoading(false);
            });
    }, []);

    // LÓGICA DE FILTRAGEM
    const filteredAlbums = useMemo(() => {
        if (!searchTerm) return albums;
        const lowerCaseSearch = searchTerm.toLowerCase();

        return albums.filter(album => 
            album.title?.toLowerCase().includes(lowerCaseSearch) ||
            album.artist?.toLowerCase().includes(lowerCaseSearch) ||
            album.id?.toLowerCase().includes(lowerCaseSearch)
        );
    }, [albums, searchTerm]);

    if (loading) return <div className="text-center py-4 text-lg">Carregando Álbuns...</div>;

    return (
        <div className="overflow-x-auto">
            <table className="admin-table">
                <thead className="admin-table-head">
                    <tr>
                        <th>ID</th>
                        <th>Título</th>
                        <th>Artista</th>
                        <th className="text-right">Ações</th>
                    </tr>
                </thead>
                <tbody className="admin-table-body">
                    {filteredAlbums.map((album) => (
                        <tr key={album.id}>
                            <td>{album.id}</td>
                            <td>{album.title}</td>
                            <td>{album.artist}</td>
                            <td className="text-right">
                                <button 
                                    onClick={() => console.log(`Ação: Editar Álbum ${album.id}`)}
                                    className="admin-action-button edit"
                                >
                                    Editar
                                </button>
                                <button 
                                    onClick={() => console.log(`Ação: Deletar Álbum ${album.id}`)}
                                    className="admin-action-button delete"
                                >
                                    Excluir
                                </button>
                            </td>
                        </tr>
                    ))}
                    {filteredAlbums.length === 0 && !loading && (
                        <tr>
                            <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                                {searchTerm ? `Nenhum álbum encontrado para "${searchTerm}".` : "Nenhum álbum cadastrado."}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default AlbumsTable;