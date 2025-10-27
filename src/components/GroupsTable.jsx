import React, { useEffect, useState, useMemo } from 'react';
import api from '../services/api';

const GroupsTable = ({ searchTerm }) => {
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/groups')
            .then(response => {
                setGroups(response.data);
                setLoading(false);
            })
            .catch(error => {
                console.error("Erro ao buscar grupos:", error);
                setLoading(false);
            });
    }, []);

    const filteredGroups = useMemo(() => {
        if (!searchTerm) return groups;
        const lowerCaseSearch = searchTerm.toLowerCase();

        return groups.filter(group => 
            group.name?.toLowerCase().includes(lowerCaseSearch) ||
            group.status?.toLowerCase().includes(lowerCaseSearch) ||
            group.description?.toLowerCase().includes(lowerCaseSearch) ||
            group.id?.toLowerCase().includes(lowerCaseSearch)
        );
    }, [groups, searchTerm]);

    if (loading) return <div className="text-center py-4 text-lg">Carregando Grupos...</div>;

    return (
        <div className="overflow-x-auto">
            <table className="admin-table">
                <thead className="admin-table-head">
                    <tr>
                        <th>ID</th>
                        <th>Nome</th>
                        <th>Membros</th>
                        <th>Status</th>
                        <th className="text-right">Ações</th>
                    </tr>
                </thead>
                <tbody className="admin-table-body">
                    {filteredGroups.map((group) => (
                        <tr key={group.id}>
                            <td>{group.id}</td>
                            <td>{group.name}</td>
                            <td>{group.members ? group.members.length : 0}</td>
                            <td>{group.status}</td>
                            <td className="text-right">
                                <button 
                                    onClick={() => console.log(`Ação: Editar Grupo ${group.id}`)}
                                    className="admin-action-button edit"
                                >
                                    Editar
                                </button>
                                <button 
                                    onClick={() => console.log(`Ação: Deletar Grupo ${group.id}`)}
                                    className="admin-action-button delete"
                                >
                                    Excluir
                                </button>
                            </td>
                        </tr>
                    ))}
                    {filteredGroups.length === 0 && !loading && (
                        <tr>
                            <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                                {searchTerm ? `Nenhum grupo encontrado para "${searchTerm}".` : "Nenhum grupo cadastrado."}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default GroupsTable;