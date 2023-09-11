/* API Rest dos prestadores */
import  express from "express";
import { connectToDatabase } from "../utils/mongodb.js";

const router = express.Router();
const {db, ObjectId} = await connectToDatabase()
const nomeCollection = 'prestadores'

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
export default router