import express from 'express'
import {connectToDatabase} from '../utils/mongodb.js'
import { Result, check, validationResult } from 'express-validator'

const router = express.Router()
const {db, ObjectId} = await connectToDatabase()
const nomeCollection = 'usuarios'

//JWT

import auth from '../middleware/auth.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

/* Validações */

const validaUsuario = [
    check('nome').not().isEmpty().trim().withMessage('É obrigatório informar o nome')
    .isAlpha('pt-BR', {ignore: ' '}).withMessage('Informe apenas texto no nome')
    .isLength({min:3}).withMessage('O nome do usuário deve ter ao menos 3 caracteres')
    .isLength({max:100}).withMessage('O nome do usuário deve ter no máximo 100 caracteres'),
    check('email')
        .not().isEmpty().trim().withMessage('O email é obrigatório')
        .isLowercase().withMessage('O email não pode ter MAIÚSCULOS')
        .isEmail().withMessage('O email deve ser válido')
        .custom((value, {req}) => {
            return db.collection(nomeCollection).find({email: {$eq: value}}).toArray().then((email) => {
                //verifica se não tem o id, para garantir que é inclusão
                if (email.length && !req.params.id){
                    return Promise.reject(`O email ${value} já existe!`)
                }
            })
        }),
    check('senha')
        .not().isEmpty().trim().withMessage('A senha é obrigatória')
        .isLength({min:6}).withMessage('A senha deve ter no mínimo 6 caracteres')
        .isStrongPassword({minLength: 6,
                            minLowercase: 1, minUppercase: 1,
                            minSymbols: 1, minNumbers: 1}).withMessage(
                                'A senha informada não é segura, Informe no minimo 1 caractere maiúsculo, 1 caractere minusculo, 1 numero e caractere especial'
                            ),
    check('ativo')
    .default(true)
    .isBoolean().withMessage('O valor deve ser um booleano. True ou False'),
    check('tipo')
    .default('Cliente')
    .isIn(['Admin', 'Cliente']).withMessage('O tipo do usuário deve ser Admin ou Cliente'),
    check('avatar')
    .isURL().withMessage('O endereço do Avatar deve ser uma URL válida')
]

//Post de usuário

router.post('/', validaUsuario, async(req, res) => {
    const schemaErrors= validationResult(req)
    if (!schemaErrors.isEmpty()){
        return res.status(403).json(({
            errors: schemaErrors.array()
        }))
    } else {

//definindo o avatar default
        req.body.avatar = `
        https://ui-avatars.com/api/?name=${req.body.nome.replace(/ /g, 'g')}&background=F00&color=00F`
//criptografia da senha
//genSalt => impede que 2 senhas iguais tenham resultados iguais
        const salt = await bcrypt.genSalt(10)
        req.body.senha = await bcrypt.hash(req.body.senha,salt)
        //iremos salvar o registro
        await db.collection(nomeCollection)
            .insertOne(req.body)
            .then(result => res.status(201).send(result))
            .catch(err => res.status(400).json(err))
    }
})

/**
 * POST /usuarios/login
 * Efetua o login do usuário e retorna o token JWT
 */

const validaLogin = [
    check('email')
    .not().isEmpty().trim().withMessage('O email é obrigatório')
    .isEmail().withMessage('Informe um e-mail válido'),
    check('senha')
    .not().isEmpty().trim().withMessage('A senha é obrigatória')
    .isLength({min:6}).withMessage('A senha deve ter no mínimo 6 carac.'),
]

router.post('/login', validaLogin, async(req, res)=> {
    const schemaErrors = validationResult(req)
    if(!schemaErrors.isEmpty()){
        return req.status(403).json(({errors: schemaErrors.array()}))
    }
    //obtendo os valores do login
    const {email, senha} = req.body
    try{
        //Verificando se o email informado existe no Mongodb
        let usuario = await db.collection(nomeCollection)
                            .find({email}).limit(1).toArray()
        //Se o array estiver vazio, é que o email não existe
        if(!usuario.length)
            return res.status(404).json({
        errors: [{
                value: `${email}`,
                msg: 'O email informado não está cadastrado',
                param: 'email'}]
            })

        //Se o email existir, comparamos se a senha está correta
        const isMatch = await bcrypt.compare(senha, usuario[0].senha)
        if(!isMatch)
            return res.status(403).json({
            errors: [{
                    value: `senha`,
                    msg: 'A senha informada está incorreta',
                    param: 'senha'}]
            })
    //iremos gerar o token JWT
    jwt.sign(
        {usuario: {id: usuario[0]._id}}, //só o id vai com o _ o resto é normal
        process.env.SECRET_KEY,
        {expiresIn: process.env.EXPIRES_IN},
        (err, token) => {
            if(err) throw err
            res.status(200).json({
                access_token: token
            })
        }
    )
    } catch(e){
        console.error(e)
    }
})

/**
 * GET /usuarios
 * Lista todos os usuarios. Necessita do token
 */

router.get('/',auth, async(req, res) => {
    try{
        db.collection(nomeCollection)
        .find({},{senha: false})
        .sort({nome:1})
        .toArray((err, docs) => {
            if(!err){ res.status(200).json(docs)}
        })
    } catch (err){
        res.status(500).json({errors:
        [{msg: 'Erro ao obter a listagem de usuarios'}]})
    }
})

/**
 * DELETE /usuarios/id
 * Remove o usuario pelo id. Necessita do token
 */

router.delete('/:id',auth, async(req, res) => {
    await db.collection(nomeCollection)
    .deleteOne({'_id': {$eq: ObjectId(req.params)}})
    .then(result => res.status(202).send(result)) //accepted
    .catch(err => res.status(400).json(err)) //bad request
})

/**
 * PUT /usuarios/id
 * Altera os dados do usuário pelo id. Necessita do token
 */

router.put('/:id', validaUsuario, async (req,res) => {
    const schemaErrors = validationResult(req)
    if(!schemaErrors.isEmpty()){
        return res.status(403).json({
            errors: schemaErrors.array()
        })
    } else {
        await db.collection(nomeCollection)
        .uptadeOne({'_id': {$eq: ObjectId(req.params.id)}},
        { $set: req.body }
        )
        .then(result => res.status(202).send(result))
        .catch(err => res.status(400).json(err))
    }
})

export default router