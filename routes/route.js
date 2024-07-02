const authRouter = require('./auth')
const userRouter = require('./user')

const route = (app)=>{
 app.use('/auth',authRouter)
 app.use('/user',userRouter)
}

module.exports = route