import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { uploadMusicaToDB, resetUploadStatus } from '../../redux/dbUploadSlice'; 
import { API_BASE_URL } from '../../services/api'; 
import './css/UploadMusica.css';
import MusicasEnviadas from '../../components/MusicaEnviada'; 

const FRONTEND_BASE_URL = 'http://localhost:5173'; 

const musicGenres = [
    "Pop", "Rock", "Hip Hop", "Eletrônica", "Jazz", 
    "Blues", "Clássica", "Metal", "R&B", "Sertanejo", 
    "Funk", "Reggae", "Gospel", "Indie", "Folk", 
    "Country", "MPB", "Axé", "Forró", "Outro"
];

const formatDuration = (seconds) => {
    if (isNaN(seconds) || seconds === 0) return "00:00";
    
    const totalSeconds = Math.round(seconds);
    
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;

    const pad = (num) => num.toString().padStart(2, '0');

    return `${pad(minutes)}:${pad(remainingSeconds)}`;
};

const getAudioDuration = (file) => {
    return new Promise((resolve) => {
        if (!file || !file.type.startsWith('audio/')) {
            return resolve("00:00");
        }
        
        const objectUrl = URL.createObjectURL(file);
        const audio = document.createElement('audio');

        audio.addEventListener('loadedmetadata', () => {
            const duration = formatDuration(audio.duration);
            resolve(duration);
            URL.revokeObjectURL(objectUrl); 
        });

        audio.addEventListener('error', () => {
            resolve("Erro ao carregar");
            URL.revokeObjectURL(objectUrl);
        });

        audio.src = objectUrl;
    });
};

const MusicaPreviewModal = ({ isOpen, onClose, musica }) => {
    
    const uploadStatus = useSelector(state => state.dbUpload.status);
    const uploadError = useSelector(state => state.dbUpload.error);
    const uploadedSongData = useSelector(state => state.dbUpload.uploadedSongData);

    const dispatch = useDispatch();

    const handleClose = () => {
        dispatch(resetUploadStatus());
        if (musica && musica.cover && musica.cover.startsWith('blob:')) {
            URL.revokeObjectURL(musica.cover);
        }
        onClose();
    };

    if (!isOpen || !musica) return null;

    const dadosExibicao = uploadStatus === 'succeeded' && uploadedSongData ? uploadedSongData : musica;
    
    const generosFormatados = (dadosExibicao.generos || []).filter(g => g.trim() !== '').join(', ');
    const duracaoFormatada = dadosExibicao.duration_string || dadosExibicao.duration || "00:00"; 
    
    const capaURL = dadosExibicao.cover || dadosExibicao.coverUrl || 'https://placehold.co/400x400/8d6a4f/e7e7e7?text=CAPA+MOCK';
    
    const songPageLink = `${FRONTEND_BASE_URL}/song/${dadosExibicao._id || dadosExibicao.id}`; 
    
    let successMessage = "Upload CONCLUÍDO!";
    let linkElement = null;

    if (uploadStatus === 'succeeded' && uploadedSongData && uploadedSongData._id) {
        
        successMessage = "Link da página da música:";
        
        linkElement = (
            <div className="success-link-block">
                <a 
                    href={songPageLink} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="song-db-link"
                >
                    {songPageLink}
                </a>
            </div>
        );
    }
    
    return (
        <div className="modal-backdrop">
            <div className="modal-content modal-content-horizontal">
                
                <h3 className="modal-header">
                    {uploadStatus === 'loading' && "Enviando para o DB..."}
                    {uploadStatus === 'succeeded' && successMessage}
                    {uploadStatus === 'failed' && "Falha no Upload"}
                    {uploadStatus === 'idle' && "Preview da Música (Local)"}
                </h3>

                {linkElement}
                
                <button 
                    onClick={handleClose} 
                    className="modal-close-button"
                    title="Fechar Preview"
                >
                    &times;
                </button>

                {uploadStatus === 'loading' && <p className="loading-message">Aguarde, enviando dados para {API_BASE_URL}/songs...</p>}

                {uploadStatus === 'failed' && (
                    <div className="error-message">
                        <p>Erro: Não foi possível adicionar a música ao DB.</p>
                        <p>Detalhes: {uploadError}</p>
                        <p>Verifique se o token de autenticação e os arquivos estão corretos.</p>
                    </div>
                )}
                
                <div className="modal-horizontal-layout">
                    <div className="modal-media-block">
                        <div className="modal-art">
                            <img 
                                src={capaURL} 
                                alt={`Capa: ${dadosExibicao.title}`}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={(e) => { e.target.src = 'https://placehold.co/400x400/8d6a4f/e7e7e7?text=CAPA+MOCK'; }}
                            />
                        </div>
                    </div>

                    <div className="modal-info-grid">
                        <div className="modal-info-item"><strong>ID (DB):</strong> {dadosExibicao._id || dadosExibicao.id || 'N/A'}</div>
                        <div className="modal-info-item"><strong>Título:</strong> {dadosExibicao.title}</div>
                        <div className="modal-info-item"><strong>Artista:</strong> {dadosExibicao.artists && dadosExibicao.artists.length > 0 ? dadosExibicao.artists[0] : 'Artista Desconhecido'}</div> 
                        <div className="modal-info-item"><strong>Gravadora:</strong> {dadosExibicao.recordLabel}</div>
                        <div className="modal-info-item-full"><strong>Gênero(s):</strong> {generosFormatados || "Nenhum"}</div>
                        <div className="modal-info-item"><strong>Data Upload:</strong> {new Date(dadosExibicao.releaseDate).toLocaleString('pt-BR')}</div>
                        <div className="modal-info-item"><strong>Duração:</strong> {duracaoFormatada}</div> 
                        <div className="modal-info-item-full"><strong>Descrição:</strong> {dadosExibicao.description || dadosExibicao.descricao || "Nenhuma"}</div>
                        
                        <div className="modal-info-item-full modal-lyrics-block">
                            <strong>Letra:</strong>
                            <pre className="modal-lyrics-text">
                                {dadosExibicao.lyrics || dadosExibicao.letra || "Letra não fornecida."}
                            </pre>
                        </div>
                        
                        

                    </div>
                </div>

                <button onClick={handleClose} className="modal-close-button-footer">Fechar</button>

            </div>
        </div>
    );
};

const UploadMusica = () => {
    const dispatch = useDispatch();
    const { status, error } = useSelector(state => state.dbUpload);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [lastUploadedMusic, setLastUploadedMusic] = useState(null);

    const [titulo, setTitulo] = useState('');
    const [descricao, setDescricao] = useState('');
    const [letra, setLetra] = useState(''); 
    const [generosSelecionados, setGenerosSelecionados] = useState([]);
    const [outroGenero, setOutroGenero] = useState('');
    const [isOutroChecked, setIsOutroChecked] = useState(false);
    const [arquivoMusica, setArquivoMusica] = useState(null); 
    const [arquivoCapa, setArquivoCapa] = useState(null); 
    const [duracaoMusica, setDuracaoMusica] = useState("00:00"); 

    const musicaInputRef = useRef(null);
    const capaInputRef = useRef(null);

    useEffect(() => {
        if (status === 'succeeded' || status === 'failed') {
             if (!isModalOpen) setIsModalOpen(true); 
        }
    }, [status, isModalOpen]);


    const openModal = (musicaData) => {
        setLastUploadedMusic(musicaData);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setLastUploadedMusic(null);
    };

    const handleGenreChange = (genero) => {
        if (genero === "Outro") {
            setIsOutroChecked(!isOutroChecked);
            setOutroGenero(''); 
            setGenerosSelecionados(prev => 
                prev.includes("Outro") 
                    ? prev.filter(g => g !== "Outro") 
                    : [...prev, "Outro"]
            );
        } else {
            setGenerosSelecionados(prev => 
                prev.includes(genero)
                    ? prev.filter(g => g !== genero)
                    : [...prev, genero]
            );
        }
    };
    
    const handleMusicFileChange = async (e) => {
        const file = e.target.files[0];
        setArquivoMusica(file); 
        
        if (file) {
            const duration = await getAudioDuration(file);
            setDuracaoMusica(duration); 
        } else {
            setDuracaoMusica("00:00");
        }
    };

    const handleUploadMusica = () => {
        const tituloMusica = titulo.trim();
        
        let userToken = null;
        try {
            const serializedUser = localStorage.getItem('loggedUser'); 
            if (serializedUser) {
                const loggedUser = JSON.parse(serializedUser);
                userToken = loggedUser.token;
            }
        } catch (e) {
            console.error("Erro ao ler token do localStorage:", e);
        }

        if (!userToken) {
            alert("Erro: Você precisa estar logado (Token JWT ausente).");
            return;
        }

        if (!tituloMusica || !arquivoMusica) {
            alert("Atenção: Título e Arquivo de Música são obrigatórios.");
            return; 
        }

        const generosFinaisParaValidacao = generosSelecionados.includes("Outro") 
            ? [...generosSelecionados.filter(g => g !== "Outro"), outroGenero.trim()]
            : generosSelecionados;
        
        const generosValidos = generosFinaisParaValidacao.filter(g => g && g.trim() !== '');

        if (generosValidos.length === 0) {
            alert("Atenção: Por favor, selecione pelo menos um Gênero para a música.");
            return; 
        }

        if (isOutroChecked && outroGenero.trim() === '' && generosSelecionados.length === 1) {
             alert("Atenção: Você selecionou 'Outro' gênero, mas não especificou qual.");
             return;
        }

        dispatch(resetUploadStatus());
        
        const generosFinais = generosValidos;
        
        const formData = new FormData();
        
        formData.append('arquivoMusica', arquivoMusica);
        if (arquivoCapa) {
            formData.append('arquivoCapa', arquivoCapa);
        }
        
        formData.append('title', tituloMusica);
        formData.append('duration', duracaoMusica); 
        formData.append('descricao', descricao);
        formData.append('letra', letra);
        formData.append('generos', JSON.stringify(generosFinais)); 
        formData.append('recordLabel', 'Independente');
        
        const coverUrlParaPreview = arquivoCapa
            ? URL.createObjectURL(arquivoCapa) 
            : 'https://placehold.co/400x400/8d6a4f/e7e7e7?text=CAPA+MOCK';
        
        const novaMusicaParaPreview = {
            title: tituloMusica,
            duration_string: duracaoMusica, 
            descricao: descricao,
            letra: letra,
            generos: generosFinais,
            cover: coverUrlParaPreview,
            releaseDate: new Date().toISOString(),
        };
        
        dispatch(uploadMusicaToDB({ formData, token: userToken }));
        
        openModal(novaMusicaParaPreview);

        setTitulo('');
        setDescricao('');
        setLetra(''); 
        setGenerosSelecionados([]);
        setOutroGenero('');
        setIsOutroChecked(false);
        setArquivoMusica(null);
        setArquivoCapa(null); 
        setDuracaoMusica("00:00"); 
    };

    const getButtonText = (file, placeholder, duration) => {
        const name = file ? `${file.name.substring(0, 30)}${file.name.length > 30 ? '...' : ''}` : placeholder;
        
        if (duration && duration !== "00:00" && duration !== "Erro ao carregar" && file) {
            return `${name} (${duration})`;
        }
        return name;
    };
    
    const isUploading = status === 'loading';

    return (
        <div className="upload-screen-wrapper"> 
            
            <div className="tela-musica-container">
                
                <div className="player-info-block">
                    <h1 className="musica-titulo">Upload de Nova Música</h1>
                    <div className="album-art">
                        {arquivoCapa ? (
                            <img 
                                src={URL.createObjectURL(arquivoCapa)} 
                                alt="Pré-visualização da Capa" 
                                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}
                            />
                        ) : (
                            "Pré-visualização da Arte do Álbum"
                        )}
                    </div>
                    <div className="like-dislike-buttons">
                    </div>
                </div>

                <div className="options-block">
                    
                    <div className="form-group">
                        <label htmlFor="titulo">Título da Música</label>
                        <input
                            id="titulo"
                            type="text"
                            value={titulo}
                            onChange={(e) => setTitulo(e.target.value)}
                            placeholder="Ex: Minha Nova Canção"
                            required 
                            disabled={isUploading}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="descricao">Descrição</label>
                        <textarea
                            id="descricao"
                            value={descricao}
                            onChange={(e) => setDescricao(e.target.value)}
                            placeholder="Detalhes sobre a música, inspirações, créditos..."
                            disabled={isUploading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="letra">Letra</label>
                        <textarea
                            id="letra"
                            rows="8" 
                            value={letra}
                            onChange={(e) => setLetra(e.target.value)}
                            placeholder="Cole a letra completa da música aqui..."
                            disabled={isUploading}
                        />
                    </div>
                    
                    <div className="form-group">
                        <label>Gêneros (Selecione um ou mais):</label>
                        <div className="genre-checkboxes">
                            {musicGenres.map((genero) => (
                                <label key={genero}>
                                    <input
                                        type="checkbox"
                                        name="genero"
                                        value={genero}
                                        checked={generosSelecionados.includes(genero)}
                                        onChange={() => handleGenreChange(genero)}
                                        disabled={isUploading}
                                    />
                                    {genero}
                                </label>
                            ))}
                        </div>
                        {isOutroChecked && (
                            <div className="other-genre-input">
                                <input
                                    type="text"
                                    value={outroGenero}
                                    onChange={(e) => setOutroGenero(e.target.value)}
                                    placeholder="Especifique o outro gênero"
                                    disabled={isUploading}
                                />
                            </div>
                        )}
                    </div>

                    <div className="options-buttons">
                        
                        <input 
                            type="file" 
                            accept=".mp3,.wav,.aac,.flac" 
                            ref={musicaInputRef} 
                            style={{ display: 'none' }} 
                            onChange={handleMusicFileChange} 
                        />
                        <button 
                            className="upload-file-button" 
                            onClick={() => musicaInputRef.current.click()}
                            disabled={isUploading}
                        >
                            {getButtonText(arquivoMusica, "Upload Arquivo de Música", duracaoMusica)} 
                        </button>
                        <div className="allowed-formats">Arquivos aceitos: **.mp3, .wav, .aac, .flac**</div>
                        
                        <input 
                            type="file" 
                            accept="image/*" 
                            ref={capaInputRef} 
                            style={{ display: 'none' }} 
                            onChange={(e) => setArquivoCapa(e.target.files[0])}
                        />
                        <button 
                            className="upload-file-button" 
                            onClick={() => capaInputRef.current.click()}
                            disabled={isUploading}
                        >
                            {getButtonText(arquivoCapa, "Upload Imagem da Música (Capa)")}
                        </button>
                        
                        <button 
                            className="submit-button"
                            onClick={handleUploadMusica}
                            disabled={isUploading}
                        >
                            {isUploading ? "Enviando..." : "Fazer Upload da Música"}
                        </button>
                    </div>
                    
                    {error && <div className="api-error-message">Erro na API: {error}</div>}
                </div>
            </div>
            
            <MusicaPreviewModal 
                isOpen={isModalOpen || isUploading || status === 'succeeded' || status === 'failed'} 
                onClose={closeModal} 
                musica={lastUploadedMusic} 
            />

            <MusicasEnviadas /> 
            
        </div>
    );
};

export default UploadMusica;