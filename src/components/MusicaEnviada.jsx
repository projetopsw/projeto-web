import React from 'react';
import { useSelector } from 'react-redux';

const selectMusicas = (state) => {
    return state.upload ? state.upload.musicas : [];
};

const ListaMusicasEnviadas = () => {
    // A função retorna null para não renderizar NADA na página.
    return null;
};

// O objeto styles foi mantido, mas não é usado, já que o componente não renderiza elementos visíveis.
const styles = {
    container: {
        maxWidth: '700px',
        margin: '40px auto',
        padding: '20px',
        border: '1px solid #ccc',
        borderRadius: '8px',
        backgroundColor: '#f9f9f9',
    },
    header: {
        borderBottom: '2px solid #333',
        paddingBottom: '10px',
        marginBottom: '20px',
        color: '#333',
    },
    emptyMessage: {
        fontStyle: 'italic',
        color: '#666',
    },
    list: {
        listStyle: 'none',
        padding: 0,
    },
    listItem: {
        padding: '15px',
        marginBottom: '10px',
        backgroundColor: '#fff',
        borderRadius: '6px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    },
    title: {
        fontWeight: 'bold',
        fontSize: '1.1em',
        marginBottom: '5px',
    },
    details: {
        fontSize: '0.85em',
        color: '#555',
        display: 'flex',
        flexDirection: 'column',
        gap: '3px'
    }
};

export default ListaMusicasEnviadas;