
import mongoose from 'mongoose';
import User from './models/user.model.js';
import 'dotenv/config'; 

const DB = 'mongodb+srv://anaisabelmatiasb_db_user:WWYrYbqyMnsIUEKD@moosica.nvvuzox.mongodb.net/?appName=Moosica'
const ADMIN_EMAIL = 'igor@email.com';
const NOVO_HASH = '$2b$10$ZB1KS.UxSRlKBCo5OEldUeOZ9AYjrxImFa7lcBEzOrRmRQFutcUt2'; 

async function resetPassword() {
    try {
        await mongoose.connect(DB);
        console.log('Conexão com MongoDB estabelecida.');

        const result = await User.updateOne(
            { email: ADMIN_EMAIL },
            { $set: { password: NOVO_HASH } }
        );

        if (result.matchedCount === 0) {
            console.error('ERRO: Usuário administrador não encontrado.');
        } else if (result.modifiedCount === 1) {
            console.log(`Sucesso! Senha do usuário ${ADMIN_EMAIL} atualizada.`);
        } else {
            console.log('Nenhuma modificação necessária (a senha já era a mesma ou não foi salva).');
        }

    } catch (error) {
        console.error('Erro ao redefinir a senha:', error);
    } finally {
        await mongoose.disconnect();
    }
}

resetPassword();