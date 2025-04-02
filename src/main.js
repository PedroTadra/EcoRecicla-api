const mysql = require('mysql2');
const express = require('express')
const cors = require('cors');
const bodyParser = require('express')
const app = express();

app.use(cors());
app.use(express.json())

// Porta do servidor
app.listen(8080, () => {
    console.log('Servidor iniciado na porta 3000: http://localhost:8080/api/login')
})


// Banco de dados ---------------------------------------------------------------------------

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'ecorecicla-local',
    database: 'ecorecicla-db'
})

connection.connect((err) => {
    console.log('Realizada a conexão com sucesso')
})


// Pegar valor do banco de dados login  ------------------------------------------------------------
function getValorBD (email, senha)  {

    return new Promise((resolve, reject) => {

        connection.query('SELECT email, senha, username FROM login WHERE email = ? and senha = ?', [email, senha], (err, rows) => {

            if (err) {
                reject('Erro na consulta: ' + err);
            } else {
                resolve(rows[0]);
            }

        });
    });
};


// Recebendo dados do login e enviando dados para o login ---------------------------------------------
app.post('/api/login', async (req, res) => {

    const email = req.body.email;
    const senha = req.body.password;
    let token = null
    let username = null

    try {
        const usuarioEncontrado = await getValorBD(email, senha, token); // Obtém os usuários do banco

        if (usuarioEncontrado) {
            username = usuarioEncontrado.username;

            let random = Math.random()*12;

            let stringAleatoria = email + random

            let stringwtring = stringAleatoria.toString()
            const base64String = Buffer.from(stringwtring).toString('base64');

            token = base64String;

            gravarTokenBD(token, username);

            return res.status(200).json({ success: true, token: token });

        } else {
            return res.status(401).json({ success: false, message: 'Usuário ou senha inválida' });
            
        }
    } catch (error) {
        console.error('Erro ao buscar usuário:', error);
        return res.status(500).json({ error: 'Erro interno no servidor' });
    }

})

async function gravarTokenBD(token, username){
    try {
        const tokenExpiracao = new Date()
        tokenExpiracao.setDate(tokenExpiracao.getDate() + 1)

        const sql = 'INSERT INTO sessao (username, token, Token_Expiraacao) VALUES (?, ?, ?)';
        const values = [username, token, tokenExpiracao];

        await connection.execute(sql, values);

        console.log('Token salvo no banco de dados com sucesso!');
    } catch (error) {
        console.error('Erro ao inserir token no banco de dados:', error);
    }

}



// Recuperar senha
app.post('/api/recuperacao-senha', async (req, res) => {

    const email = req.body.email

    try {
        const usuarioRecEncontrado = await getValorBDRec(email); // Obtém os usuários do banco

        if (usuarioRecEncontrado) {

            let senhaRandom = parseInt(Math.random() * 90000 + 10000).toString();

            UpdateSenhaBD(usuarioRecEncontrado, senhaRandom);

            return res.status(200).json({ message: 'Senha temporaria atualizada com sucesso. Verifique seu email.', success: true });

        } else {
            return res.status(401).json({ message: 'Usuario não encontrado na base de dados', success: false });
            
        }
    } catch (error) {
        console.error('Erro ao buscar usuário:', error);
        return res.status(500).json({ error: 'Erro interno no servidor' });
    }

})

function getValorBDRec(email){

    return new Promise((resolve, reject) => {

        connection.query('SELECT email, senha FROM login WHERE email = ?', [email], (err, rows) => {

            if (err) {
                reject('Erro na consulta: ' + err);
            } else {
                resolve(rows[0]);
            }

        });
    });
}

function UpdateSenhaBD(usuarioRecEncontrado, senhaRandom){
    return new Promise((resolve, reject) => {
        connection.query('UPDATE login SET senha = ? WHERE email = ?', [senhaRandom, usuarioRecEncontrado.email], (err, result) => {
            if (err) {
                reject('Erro ao atualizar senha: ' + err);
            } else {
                resolve(result);
                console.log('Senha atualizada com sucesso para o email:', usuarioRecEncontrado.email);
            }
        });
    });
}

console.log("ola")