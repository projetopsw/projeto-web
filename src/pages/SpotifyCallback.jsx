import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const SpotifyCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    useEffect(() => {
        const token = searchParams.get('token');

        if (token) {
            console.log("Token recebido:", token);
            
            localStorage.setItem('moosica_token', token);

            navigate('/'); 
        } else {
            console.error("Token não encontrado.");
            navigate('/login');
        }
    }, [searchParams, navigate]);

    return (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '50px' }}>
            <h2>Autenticando com Spotify... aguarde. 🎵</h2>
        </div>
    );
};

export default SpotifyCallback;