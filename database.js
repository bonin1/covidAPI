const Sequelize = require('sequelize')
const sequelize = new Sequelize('covidapi_122','root','',{
    host:'localhost',
    dialect:'mysql'
})

sequelize.authenticate()
.then(()=>{
    console.log('baza u lidh')
})
.catch(error=>{
    console.log(error)
})

module.exports = sequelize