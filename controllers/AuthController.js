const { generateToken } = require("../config/token/token")
const User = require("../models/User")


class AuthController {
    async login(req, res, next){
        try{
            const {email, password} = req.body

            if(!email || !password){
                res.status(400).json({
                    status:'error',
                    message:'Both email and password are required!'
                })
            }

            const findUser = User.findOne({email}).select('+password')

            if(!findUser || !findUser.password){
                res.status(400).json({
                    status:'error',
                    message: 'Password is incorrect'
                })
                return
            }

            if(!findUser || (await !findUser.correctPassword(password,findUser.password))){
                res.status(400).json({
                    status:'error',
                    message:'Email or password is incorrect'
                })
            }

            const token = generateToken(findUser._id)

            res.status(200).json({
                status:'success',
                message: "Logged successfully!",
                token
            })
        }
        catch(err){

        }
    }
}

module.exports = new AuthController()