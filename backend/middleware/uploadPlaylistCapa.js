// src/middleware/uploadPlaylistCapa.js
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs'; 

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BACKEND_ROOT_DIR = path.join(__dirname, '..', '..'); // Assumindo que '../..' é a raiz do backend

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const destinationPath = path.join(BACKEND_ROOT_DIR, 'public', 'cover_images'); 
        
        if (!fs.existsSync(destinationPath)) {
            try {
                fs.mkdirSync(destinationPath, { recursive: true });
            } catch (error) {
                return cb(new Error('Falha ao criar diretório de destino da capa.'), '');
            }
        }
        cb(null, destinationPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileExtension = path.extname(file.originalname);
        cb(null, 'playlist_cover-' + uniqueSuffix + fileExtension);
    }
});

const fileFilter = (req, file, cb) => {
    if (file.fieldname === 'arquivoCapa') {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Tipo de arquivo de imagem não suportado.'));
        }
    } else {
        cb(new Error('Campo de arquivo desconhecido para playlist.'));
    }
};

const uploadPlaylistCapaMiddleware = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: { 
        fileSize: 1024 * 1024 * 5 // 5MB
    }
}).single('arquivoCapa'); 

export default uploadPlaylistCapaMiddleware;