import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs'; 

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BACKEND_ROOT_DIR = path.join(__dirname, '..'); 

const storageCapa = multer.diskStorage({
    destination: (req, file, cb) => {
        if (file.fieldname !== 'coverImage') { 
            return cb(new Error('Campo de arquivo de edição inválido. Esperado: coverImage.'), '');
        }
        
        const destinationPath = path.join(BACKEND_ROOT_DIR, 'public', 'cover_images');

        if (!fs.existsSync(destinationPath)) {
            try {
                fs.mkdirSync(destinationPath, { recursive: true });
            } catch (error) {
                return cb(new Error('Falha ao criar diretório de destino.'), '');
            }
        }
        
        cb(null, destinationPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileExtension = path.extname(file.originalname);
        cb(null, 'cover-edit-' + uniqueSuffix + fileExtension);
    }
});

const fileFilterCapa = (req, file, cb) => {
    if (file.fieldname === 'coverImage') {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Tipo de arquivo de imagem para capa não suportado.'));
        }
    } else {
        cb(null, true); 
    }
};

const uploadCapaMiddleware = multer({ 
    storage: storageCapa,
    fileFilter: fileFilterCapa,
    limits: { 
        fileSize: 1024 * 1024 * 5 
    }
}); 

export default uploadCapaMiddleware; 