import jwt from 'jsonwebtoken'

export default async function auth(req, res, next) {
    const token = req.header('access-token') ||
        req.headers['x-access-token']
    if (!token) return res.status(401).json({//401 - Unauthorized
        mensage: "Acesso negado. É obrigatório o envio do token jwt"
    })
    try {
        const decoded = jwt.verify(token, process.env.SECRET_KEY)
        /*
        O decoded irá conter:
        usuario (payload do usuário)
        exp (expiration) - data de expiração
        iat (issued at) - data de criação
        */
        req.usuario = await decoded.usuario
        next() //Direcionamos para o endPoint
    } catch (e) {
        res.status(403).send({ error: `Token inválido: ${e.message}` })
        console.error(e.mensage)
    }
}
