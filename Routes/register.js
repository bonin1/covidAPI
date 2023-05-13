const Qyteti = require('../Models/QytetiModel')
const express = require('express')
const router = express.Router()

router.get('/',(req,res)=>{
    Qyteti.create({
        emri:'Ferizaj',
        te_infektuar: 3229,
        te_sheruar:611,
        te_vdekur:75
    })
    .then(()=>{
        res.send('Te dhenat u ruajten')
    })
    .catch(error=>{
        res.send(error)
    })
})

module.exports = router