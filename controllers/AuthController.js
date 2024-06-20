const { generateToken } = require("../config/token/token")
const User = require("../models/User")
const filterObj = require("../utils/filterObj")
const otpGenerator = require('otp-generator')

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
            next(err)
        }

    }
    async register(req,res,next){
        const {firstName, lastName, email, password} = req.body 
        const filteredBody = filterObj(req.body,'firstName','lastName','password')
        const findUser = await User.findOne(email)

        if(findUser && findUser.verified){
            res.status(400),json({
                status:'error',
                message: 'Email is already in use. Please login'
            })
        }else if(findUser){
            const updateUser = await User.findOneAndUpdate({email},filterObj,{
                new:true,
                validateModifiedOnly: true
            })

            req.userID = findUser._id
        }else{
            const newUser = await User.create(filteredBody)

            // Generate OTP

            req.userId = newUser._id
        }


    }
    async sendOTP(req,res,next){
        const {userID} = req

        const newOTP = otpGenerator.generate(6,{
            lowerCaseAlphabets:false,
            upperCaseAlphabets:false,
            specialChars:false
        })

        const otpExpiredTime = Date.now() + 10*60*1000

        await User.findByIdAndUpdate(userID,{
            otp: newOTP,
            otpExpiredTime: otpExpiredTime
        })

        res.status(200).json({
            status:'success',
            message:'OTP sent successfully'
        })
    }
    async verifiedOTP(req,res,next){
        const {email,otp} = req.body

        const findUser = await User.findOne({
            email,
            otpExpiredTime:{
                $gt: Date.now()
            }
        })
        if(!findUser){
            res.status(400).json({
                status:'error',
                message:'Email is invalid or OTP is expired'
            })
        }
    }
}

module.exports = new AuthController()