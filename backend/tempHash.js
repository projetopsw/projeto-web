//
//
// CRIA UM NOVO HASH PARA BOTAR DE SENHA
//
//

import bcrypt from 'bcryptjs';

// TROQUE A NOVA SENHA AQUI
const NOVA_SENHA = 'Igor'; 

async function generateHash() {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(NOVA_SENHA, salt);
    console.log("NOVA SENHA:", NOVA_SENHA);
    console.log("HASH GERADO:", hash);
}

generateHash();