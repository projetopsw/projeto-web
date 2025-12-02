import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BACKEND_ROOT_DIR = path.join(__dirname, '..'); 

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let destinationPath;

        if (file.fieldname === 'arquivoMusica') {
            destinationPath = path.join(BACKEND_ROOT_DIR, 'public', 'music_files'); 
        } else if (file.fieldname === 'arquivoCapa') {
            destinationPath = path.join(BACKEND_ROOT_DIR, 'public', 'cover_images');
        } else {
            return cb(new Error('Campo de arquivo desconhecido'), '');
        }

        console.log("Caminho de Destino Tentado:", destinationPath); 
        
        cb(null, destinationPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileExtension = path.extname(file.originalname);
        const baseName = file.fieldname === 'arquivoMusica' ? 'song' : 'cover';
        cb(null, baseName + '-' + uniqueSuffix + fileExtension);
    }
});

const fileFilter = (req, file, cb) => {
    if (file.fieldname === 'arquivoMusica') {
        if (file.mimetype.startsWith('audio/')) {
            cb(null, true);
        } else {
            cb(new Error('Tipo de arquivo de música não suportado. Use .mp3, .wav, etc.'));
        }
    } else if (file.fieldname === 'arquivoCapa') {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Tipo de arquivo de imagem não suportado. Use .jpg, .png, etc.'));
        }
    } else {
        cb(new Error('Campo de arquivo inválido.'));
    }
};

const uploadMusicaMiddleware = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: { 
        fileSize: 1024 * 1024 * 50
    }
}).fields([
    { name: 'arquivoMusica', maxCount: 1 }, 
    { name: 'arquivoCapa', maxCount: 1 }      
]);

export default uploadMusicaMiddleware;