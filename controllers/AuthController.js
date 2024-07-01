const { generateToken } = require("../config/token/token")
const User = require("../models/User")

const filterObj = require("../utils/filterObj")
const otpGenerator = require('otp-generator')

const promisify = require("util")
const jwt = require("jsonwebtoken")

class AuthController {
    async login(req, res, next) {
        try {
            const { email, password } = req.body

            if (!email || !password) {
                res.status(400).json({
                    status: 'error',
                    message: 'Both email and password are required!'
                })
            }

            const findUser = User.findOne({ email }).select('+password')

            if (!findUser || !findUser.password) {
                res.status(400).json({
                    status: 'error',
                    message: 'Password is incorrect'
                })
                return
            }

            if (!findUser || (await !findUser.correctPassword(password, findUser.password))) {
                res.status(400).json({
                    status: 'error',
                    message: 'Email or password is incorrect'
                })
            }

            const token = generateToken(findUser._id)

            res.status(200).json({
                status: 'success',
                message: "Logged successfully!",
                token
            })
        }

        catch (err) {

            next(err)
        }

    }
    async register(req, res, next) {
        const { firstName, lastName, email, password } = req.body
        const filteredBody = filterObj(req.body, 'firstName', 'lastName', 'password')
        const findUser = await User.findOne(email)

        if (findUser && findUser.verified) {
            res.status(400), json({
                status: 'error',
                message: 'Email is already in use. Please login'
            })
        } else if (findUser) {
            const updateUser = await User.findOneAndUpdate({ email }, filterObj, {
                new: true,
                validateModifiedOnly: true
            })

            req.userID = findUser._id
        } else {
            const newUser = await User.create(filteredBody)

            // Generate OTP

            req.userId = newUser._id
        }


    }
    async sendOTP(req, res, next) {
        const { userID } = req

        const newOTP = otpGenerator.generate(6, {
            lowerCaseAlphabets: false,
            upperCaseAlphabets: false,
            specialChars: false
        })

        const otpExpiredTime = Date.now() + 10 * 60 * 1000

        await User.findByIdAndUpdate(userID, {
            otp: newOTP,
            otpExpiredTime: otpExpiredTime
        })

        res.status(200).json({
            status: 'success',
            message: 'OTP sent successfully'
        })
    }
    async verifiedOTP(req, res, next) {
        const { email, otp } = req.body

        const findUser = await User.findOne({
            email,
            otpExpiredTime: {
                $gt: Date.now()
            }
        })
        if (!findUser) {
            res.status(400).json({
                status: 'error',
                message: 'Email is invalid or OTP is expired'
            })
        }

        if (!findUser.correctOTP(otp, findUser.otp)) {
            res.status(400).json({
                status: 'error',
                message: 'OTP is incorrect'
            })
        }

        findUser.verified = true
        findUser.otp = undefined

        await findUser.save({
            new: true,
            validateModifiedOnly: true
        })

        const token = generateToken(findUser._id)

        res.status(200).json({
            status: 'succes',
            message: 'Logged is successfully',
            token
        })

    }

    async forgotPassword(req, res, next) {
        const { email } = req.body
        const findUser = await User.findOne(email)
        if (!findUser) {
            res.status(400).json({
                status: 'error',
                message: 'Email not found'
            })
            return
        }

        const resetToken = User.createResetPasswordToken()

        const resetURL = ''

        try {
            // send email reset password

            res.status(200).json({
                status: 'success',
                message: 'reset password sent to your email'
            })
        } catch (err) {
            User.passwordResetToken = undefined
            User.passwordResetExpires = undefined

            await User.save({ validateBeforeSave: false })

            res.status(500).json({
                status: 'error',
                message: 'Error Sending Email'
            })
        }
    }

    async resetPassword (req,res,next){
        const hashedToken = crypto.createHash('sha256').update(req.param.token).digest('hex')

        const findUser = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires:{$gt: Date.now()}
        })

        if(!findUser){
            res.status(400).json({
                status:'error',
                message:'Token is expired or invalid'
            })
            return
        }

        User.password = req.body.password
        User.confirmPassword = req.body.confirmPassword
        User.passwordResetToken = undefined
        User.passwordResetExpires = undefined

        await User.save()

        const token = generateToken(User._id)
        //Send an email to inform new password

        res.status(200).json({
            status:'success',
            message:'Password reset successfully',
            token
        })
    }

    async protect(req,res,next){
        let token
        if(req.headers.authorization && req.headers.authorization.startsWith("Bearer")){
            token = req.header.authorization.split(' ')[1]
        }else if(req.cookies.jwt){
            token = req.cookies.jwt
        }

        if(!token){
            res.status(401).json({
                status:'error',
                message:'You are not logged in! Please log in to get access.'
            })
            return
        }

        const decoded = await promisify(jwt.verify)(token, process.env.SECRET_KEY);

        const findUser = await User.findById(decoded.userID)

        if(!findUser){
            res.status(400).json({
                status:'error',
                message:"User doesn't exist"
            })
            return
        }

        if(findUser.changedPasswordAfter(decoded.iat)){
            res.status(400).json({
                status:'error',
                message: 'User recently changed password. Please log in again!'
            })

        }

        req.user = findUser
        next()

    }
}

module.exports = new AuthController()