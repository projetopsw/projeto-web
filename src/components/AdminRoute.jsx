// Exemplo de correção no AdminRoute.js
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const AdminRoute = ({ children }) => {
    // IMPORTANTE: Busque do userSlice, igual fizemos no botão
    const { user } = useSelector((state) => state.user);
    
    // Verifica se o usuário existe E se o role é admin
    // Se não for, manda para a home ("/")
    if (!user || user.role !== 'admin') {
        return <Navigate to="/" replace />;
    }

    return children;
};

export default AdminRoute;