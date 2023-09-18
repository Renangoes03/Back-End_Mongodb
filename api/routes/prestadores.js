/* API Rest dos prestadores */
import  express from "express";
import { connectToDatabase } from "../utils/mongodb.js";
import { check, validationResult } from 'express-validator' 

const router = express.Router();
const {db, ObjectId} = await connectToDatabase()
const nomeCollection = 'prestadores'


const validaPrestador = [
    check('cnpj')
    .not().isEmpty().trim().withMessage('É obrigatório informar o CNPJ')
    .isNumeric().withMessage('O CNPJ deve conter números')
    .isLength({min : 14, max : 14}).withMessage('O CNPJ deve conter no máximo 14 números'),
    check('razao_social')
    .not().isEmpty().trim().withMessage('É obrigatório informar a razao')
    .isAlphanumeric('pt-BR', {ignore : '/ .'})
    .withMessage('A razao social não deve conter caracteres especiais')
    .isLength({min : 5}).withMessage('A razao é muita curta. Mínimo 5')
    .isLength({max : 200}).withMessage('A razao é muito longa. Máximo 200'),
    check('cnae_fiscal')
    .isNumeric().withMessage('O código do CNAE deve ser um número'),
    check('nome_fantasia').optional({nullable : true})
]

/*
 * GET   /API/PRESTADORES
 * LISTA DE TODOS OS PRESTADORES
 */

router.get('/',async(req,res) => {
    try{
        db.collection(nomeCollection).find().sort({razao_social: 1})
        .toArray((err,docs) => {
            if(!err){
                res.status(200).json(docs)
            }
        })
    } catch (err){
        res.status(500).json({
            errors: [{
                value: `${err.message}`,
                msg:`Erro ao obter a listagem dos prestadores`,
                param: '/'
            }]
        })
    }
})

/*
 * GET   /API/PRESTADORES/ : ID
 * LISTA DE TODOS OS PRESTADORES
 */
router.get('/id/:id', async(req, res ) =>{
    try{
        db.collection(nomeCollection).find({'_id' : {$eq: ObjectId(req.params.id)}})
        .toArray((err, docs) => {
            if(err){
                res.status(400).json(err) //bad resquest
            }else{
                res.status(200).json(docs) //retorna documento
            }
     })
    }catch (err){
        res.status(500).json({"erro" : err.message})
    }
})
/*
 * DELETE /API/PRESTADORES/ : ID
 * APAGA TODOS OS PRESTADORES DE SERVIÇO PELO ID
 */

router.delete('/:id', async(req, res) => {
    await db.collection(nomeCollection)
    .deleteOne({"_id": {$eq: ObjectId(req.params)}})
    .then(result => res.status(200).send(result))
    .catch(err => res.status(400).json(err))
})
/*
 * POST /API/PRESTADORES/ : ID
 * INSIRA UM NOVO PRESTADOR DE SERVIÇO
 */
router.post('/', validaPrestador, async(req, res) => {
    const erros = validationResult(req)
    if(!erros.isEmpty()){
        return res.status(400).json(({
            erros : erros.array()

        }))
    }else{
        await db.collection(nomeCollection)
        .insertOne(req.body)
        .then(result => res.status(200).send(result))
        .catch(err => res.status(400).json(err))
    }
})
/*
 * PUT /API/PRESTADORES/ : ID
 * ALTERA UM NOVO PRESTADOR DE SERVIÇO
 */
router.put('/', validaPrestador, async(req, res) => {
    let idDocumento = req.body._id  //armazenando o id documento
    delete req.body._id //iremos remover o id do body
    const erros = validationResult(req)
    if(!erros.isEmpty()){
        return res.status(400).json(({
            erros : erros.array()
        }))
    }else{
        await db.collection(nomeCollection)
        .updateOne({'_id' : {$eq : ObjectId(idDocumento)}},
        {$set : req.body})
        .then(result => res.status(200).send(result))
        .catch(err => res.status(400).json(err))
    }
})
export default router