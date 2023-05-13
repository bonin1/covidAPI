const express = require('express')
const app = express()
const sequelize = require('./database')
sequelize.sync()
app.set('view engine','ejs')
const register = require('./Routes/register')
const qytetet = require('./Routes/qytetet')
const update = require('./Routes/update')
app.use('/update',update)
app.use('/register',register)
app.use('/qytetet',qytetet)
app.listen(8080,()=>{
    console.log('ready!')
})