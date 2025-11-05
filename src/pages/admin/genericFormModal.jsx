import React, { useState } from 'react';

const createInitialState = (formFields) => {
    return formFields.reduce((acc, field) => {
        acc[field.name] = field.type === 'checkbox' ? false : '';
        return acc;
    }, {});
};

const AdminGenericFormModal = ({ config, onClose, onSubmit, initialData = null, title }) => {
    const [formData, setFormData] = useState(
        initialData || createInitialState(config.formFields)
    );

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const renderField = (field) => {
        const commonProps = {
            id: field.name,
            name: field.name,
            onChange: handleChange,
            required: field.required,
        };

        if (field.type === 'checkbox') {
            return (
                <input
                    type="checkbox"
                    {...commonProps}
                    checked={!!formData[field.name]}
                />
            );
        }

        return (
            <input
                type={field.type}
                {...commonProps}
                value={formData[field.name] ?? ''}
                className="admin-form-input"
            />
        );
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close-button" onClick={onClose}>&times;</button>
                <h2>{title || `Adicionar Novo(a) ${config.singular}`}</h2>

                <form onSubmit={handleSubmit} className="admin-add-form">
                    {config.formFields.map((field) => (
                        <div className="form-group" key={field.name}>
                            <label htmlFor={field.name}>{field.label}:</label>
                            {renderField(field)}
                        </div>
                    ))}
                    <button type="submit" className="form-submit-button">Salvar</button>
                </form>
            </div>
        </div>
    );
};


export default AdminGenericFormModal;