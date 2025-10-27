import React, { useState, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { uploadMusica } from '../../redux/uploadSlice'; 
import './css/UploadMusica.css';
import MusicasEnviadas from '../../components/MusicaEnviada';

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
    
    if (!isOpen || !musica) return null;

    const generosFormatados = musica.generos.filter(g => g.trim() !== '').join(', ');
    const duracaoFormatada = musica.duracao || "00:00"; 
    
    const capaURL = musica.arquivoCapa ? URL.createObjectURL(musica.arquivoCapa) : '';


    return (
        <div className="modal-backdrop">
            <div className="modal-content">
                
                <h3 className="modal-header">Upload Concluído! Preview da Música</h3>
                
                <button 
                    onClick={onClose} 
                    className="modal-close-button"
                    title="Fechar Preview"
                >
                    &times;
                </button>

                {/* Removido o Bloco de Controles de Áudio (Player) */}
                <div className="modal-media-block">
                    <div className="modal-art">
                        {capaURL ? (
                            <img 
                                src={capaURL} 
                                alt={`Capa: ${musica.titulo}`}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        ) : (
                            <span>Sem Pré-visualização de Capa</span>
                        )}
                    </div>
                </div>

                <div className="modal-info-grid">
                    <div className="modal-info-item"><strong>ID:</strong> {musica.id}</div>
                    <div className="modal-info-item"><strong>Título:</strong> {musica.titulo}</div>
                    <div className="modal-info-item-full"><strong>Descrição:</strong> {musica.descricao || "Nenhuma"}</div>
                    
                    <div className="modal-info-item"><strong>Artista:</strong> Artista Padrão (Mock)</div> 
                    <div className="modal-info-item"><strong>Álbum:</strong> Nenhum</div>
                    <div className="modal-info-item-full"><strong>Gênero(s):</strong> {generosFormatados || "Nenhum"}</div>
                    
                    <div className="modal-info-item"><strong>Data e Horário:</strong> {new Date(musica.dataUpload).toLocaleString('pt-BR')}</div>
                    <div className="modal-info-item"><strong>Duração:</strong> {duracaoFormatada}</div> 
                </div>

                <p className="modal-file-info">
                    Arquivos: Música: *{musica.nomeArquivoMusica}* | Capa: *{musica.nomeArquivoCapa}*
                </p>
            </div>
        </div>
    );
};

const UploadMusica = () => {
    const dispatch = useDispatch();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [lastUploadedMusic, setLastUploadedMusic] = useState(null);

    const [titulo, setTitulo] = useState('');
    const [descricao, setDescricao] = useState('');
    const [generosSelecionados, setGenerosSelecionados] = useState([]);
    const [outroGenero, setOutroGenero] = useState('');
    const [isOutroChecked, setIsOutroChecked] = useState(false);
    const [arquivoMusica, setArquivoMusica] = useState(null);
    const [arquivoCapa, setArquivoCapa] = useState(null);
    const [duracaoMusica, setDuracaoMusica] = useState("00:00"); 

    const musicaInputRef = useRef(null);
    const capaInputRef = useRef(null);

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
        
        if (!tituloMusica) {
            alert("Atenção: Você deve preencher o campo 'Título da Música' para fazer o upload.");
            return; 
        }
        
        const generosFinais = generosSelecionados.includes("Outro") 
            ? [...generosSelecionados.filter(g => g !== "Outro"), outroGenero]
            : generosSelecionados;

        const novaMusica = {
            id: Date.now(), 
            titulo: tituloMusica,
            descricao: descricao,
            generos: generosFinais.filter(g => g.trim() !== ''), 
            nomeArquivoMusica: arquivoMusica ? arquivoMusica.name : 'N/A',
            nomeArquivoCapa: arquivoCapa ? arquivoCapa.name : 'N/A',
            dataUpload: new Date().toISOString(),
            duracao: duracaoMusica,
            arquivoMusica: arquivoMusica,
            arquivoCapa: arquivoCapa,
        };

        dispatch(uploadMusica(novaMusica));
        
        openModal(novaMusica);

        setTitulo('');
        setDescricao('');
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
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="descricao">Descrição</label>
                        <textarea
                            id="descricao"
                            value={descricao}
                            onChange={(e) => setDescricao(e.target.value)}
                            placeholder="Detalhes sobre a música, inspirações, créditos..."
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
                        >
                            {getButtonText(arquivoCapa, "Upload Imagem da Música (Capa)")}
                        </button>
                        
                        <button 
                            className="submit-button"
                            onClick={handleUploadMusica}
                        >
                            Fazer Upload da Música
                        </button>
                    </div>
                </div>
            </div>
            
            <MusicaPreviewModal 
                isOpen={isModalOpen} 
                onClose={closeModal} 
                musica={lastUploadedMusic} 
            />

            <MusicasEnviadas /> 
            
        </div>
    );
};

export default UploadMusica;