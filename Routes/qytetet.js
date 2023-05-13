const Qyteti = require('../Models/QytetiModel')
const express = require('express')
const router = express.Router()

router.get('/',(req,res)=>{
    Qyteti.findAll()
    .then((results)=>{
        res.json(results)
    })
    .catch(error=>{
        res.send(error)
    })
})

router.get('/test',(req,res)=>{
    res.render('qytetet')
})
router.get('/:emri',(req,res)=>{
    Qyteti.findAll({
        where:{
            emri:req.params.emri
        }
    })
    .then(results=>{
        res.json(results)
    })
    .catch(error=>{
        res.send(error)
    })
})

module.exports = router