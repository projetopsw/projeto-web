import React, { useEffect, useState, useMemo } from 'react';
import api from '../services/api';

const UsersTable = ({ searchTerm }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/users')
            .then(response => {
                setUsers(response.data);
                setLoading(false);
            })
            .catch(error => {
                console.error("Erro ao buscar usuários:", error);
                setLoading(false);
            });
    }, []);

    const filteredUsers = useMemo(() => {
        if (!searchTerm) return users;
        const lowerCaseSearch = searchTerm.toLowerCase();

        return users.filter(user => 
            user.name?.toLowerCase().includes(lowerCaseSearch) ||
            user.email?.toLowerCase().includes(lowerCaseSearch) ||
            user.id?.toLowerCase().includes(lowerCaseSearch) ||
            user.role?.toLowerCase().includes(lowerCaseSearch)
        );
    }, [users, searchTerm]);

    if (loading) return <div className="text-center py-4 text-lg">Carregando Usuários...</div>;

    return (
        <div className="overflow-x-auto">
            <table className="admin-table">
                <thead className="admin-table-head">
                    <tr>
                        <th>ID</th>
                        <th>Nome</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th className="text-right">Ações</th>
                    </tr>
                </thead>
                <tbody className="admin-table-body">
                    {filteredUsers.map((user) => (
                        <tr key={user.id}>
                            <td>{user.id}</td>
                            <td>{user.name}</td>
                            <td>{user.email}</td>
                            <td style={{ color: user.role === 'admin' ? '#ef4444' : 'var(--text-color)' }}>{user.role || 'user'}</td>
                            <td className="text-right">
                                <button 
                                    onClick={() => console.log(`Ação: Editar Usuário ${user.id}`)}
                                    className="admin-action-button edit"
                                >
                                    Editar
                                </button>
                                <button 
                                    onClick={() => console.log(`Ação: Deletar Usuário ${user.id}`)}
                                    className="admin-action-button delete"
                                >
                                    Excluir
                                </button>
                            </td>
                        </tr>
                    ))}
                    {filteredUsers.length === 0 && !loading && (
                        <tr>
                            <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                                {searchTerm ? `Nenhum usuário encontrado para "${searchTerm}".` : "Nenhum usuário cadastrado."}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default UsersTable;