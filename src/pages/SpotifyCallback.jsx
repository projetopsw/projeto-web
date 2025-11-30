import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const SpotifyCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    useEffect(() => {
        // 1. Pega o token que o Backend mandou via URL (?token=...)
        const token = searchParams.get('token');

        if (token) {
            console.log("Token recebido:", token);
            
            // 2. Salva no LocalStorage para usar em outras requisições
            localStorage.setItem('moosica_token', token);

            // 3. Redireciona o usuário para a página principal (Home)
            navigate('/'); 
        } else {
            // Se algo deu errado e não veio token, manda voltar pro login
            console.error("Token não encontrado.");
            navigate('/login');
        }
    }, [searchParams, navigate]);

    // O que aparece na tela enquanto o redirecionamento acontece
    return (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '50px' }}>
            <h2>Autenticando com Spotify... aguarde. 🎵</h2>
        </div>
    );
};

export default SpotifyCallback;