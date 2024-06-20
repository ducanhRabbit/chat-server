const mongoose = require('mongoose')

const DB = process.env.DBURI.replace('<password>', process.env.DBPASSWORD)
const connectToDB = ()=>{
    mongoose.connect(DB,{
        //options
    }).then(()=>{
        console.log('Connection successful')
    }).catch((err)=>{
        console.log(`Connection faild: ${err.message}`)
    })
}

module.exports = {connectToDB}