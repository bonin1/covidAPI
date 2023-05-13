const Sequelize = require('sequelize')
const sequelize = require('../database')

const Qytetet = sequelize.define('qytetet',{
    emri:{
        type:Sequelize.STRING(30),
        allowNull:false
    },
    te_infektuar:{
        type:Sequelize.STRING(7)
    },
    te_sheruar:{
        type:Sequelize.STRING(7),
        allowNull:false
    },
    te_vdekur:{
        type:Sequelize.STRING(7),
        allowNull:false
    }
},{
    timestamps:false
})

module.exports = Qytetet