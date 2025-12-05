import React, { useState } from 'react';

const DeleteMusica = ({ show, onClose, onConfirm, itemTitle }) => {
    const [confirmationText, setConfirmationText] = useState('');

    if (!show) {
        return null;
    }

    const isConfirmed = confirmationText === itemTitle;

    const handleDelete = () => {
        if (isConfirmed) {
            onConfirm();
            onClose(); 
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
        }}>
            <div style={{
                backgroundColor: '#282828',
                padding: '30px',
                borderRadius: '8px',
                width: '400px',
                color: 'white',
                boxShadow: '0 4px 10px rgba(0, 0, 0, 0.5)',
            }}>
                <h2>Confirmar Exclusão</h2>
                <p>Tem certeza de que deseja deletar permanentemente a música **{itemTitle}**?</p>
                <p>Para confirmar, digite o nome completo da música abaixo:</p>
                
                <input
                    type="text"
                    value={confirmationText}
                    onChange={(e) => setConfirmationText(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '10px',
                        margin: '10px 0 20px 0',
                        borderRadius: '4px',
                        border: '1px solid #535353',
                        backgroundColor: '#3e3e3e',
                        color: 'white',
                    }}
                />

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: '#535353',
                            color: 'white',
                            border: 'none',
                            borderRadius: '20px',
                            cursor: 'pointer',
                        }}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleDelete}
                        disabled={!isConfirmed}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: isConfirmed ? '#E91E63' : '#611f37',
                            color: 'white',
                            border: 'none',
                            borderRadius: '20px',
                            cursor: isConfirmed ? 'pointer' : 'not-allowed',
                            transition: 'background-color 0.3s',
                        }}
                    >
                        Deletar Permanentemente
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteMusica;