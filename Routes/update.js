const Qyteti = require('../Models/QytetiModel')
const express = require('express')
const router = express.Router()

router.get('/',(req,res)=>{
    Qyteti.findOne({
        where:{
            emri:'Peje'
        }
    })
    .then((row)=>{
        row.update({
            te_infektuar:3517,
            te_sheruar:552,
            te_vdekur:51
        })
        .then(updateRow=>{
            res.send('Updated')
        })
    })
})
module.exports = router