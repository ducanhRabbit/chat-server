const { generateToken } = require("../config/token/token")
const User = require("../models/User")

const filterObj = require("../utils/filterObj")
const otpGenerator = require('otp-generator')

const promisify = require("util")
const jwt = require("jsonwebtoken")

const sendRSMail = require('../sevices/mail')

const crypto = require('crypto')

class AuthController {
    async login(req, res, next) {
        try {
            const { email, password } = req.body

            if (!email || !password) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Both email and password are required!'
                })
            }

            const findUser = await User.findOne({ email: email }).select('+password')
            console.log(findUser)
            if (!findUser || !findUser.password) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Password is incorrect'
                })
            
            }

            if (!findUser || !(await findUser.correctPassword(password, findUser.password))) {
               return res.status(400).json({
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
        try{

            const { firstName, lastName, email, password } = req.body
    
            const filteredBody = filterObj(req.body, 'firstName', 'lastName', 'password', 'email')
            const findUser = await User.findOne({ email })
    
            if (findUser) {
                res.status(400).json({
                    status: 'error',
                    message: 'Email is already in use. Please login'
                })
                return
            } else {
                const newUser = await User.create(filteredBody)
    
                // Generate OTP
    
                req.userID = newUser._id
                next()
            }
        }catch(err){
            next(err)
        }


    }
    async sendOTP(req, res, next) {
        try{
            const { userID } = req
            const newOTP = otpGenerator.generate(6, {
                lowerCaseAlphabets: false,
                upperCaseAlphabets: false,
                specialChars: false
            })
    
    
            const otpExpiredTime = Date.now() + 10 * 60 * 60 * 1000
    
            const user = await User.findByIdAndUpdate({ _id: userID }, {
                otpExpiredTime: otpExpiredTime
            })
            user.otp = newOTP.toString();
            user.save({ new: true, validateModifiedOnly: true })
    
            // Send Email
    
            sendRSMail({
                from: 'onboarding@resend.dev',
                to: 'renyk97@gmail.com',
                subject: 'Verified OTP',
                html: `<p>OTP for verification is <strong>${newOTP}</strong>!</p>`
            }).then(() => {
                console.log('success')
            })
    
            res.status(200).json({
                status: 'success',
                message: 'OTP sent successfully'
            })
        }catch(err){
            next(err)
        }
    }
    async verifiedOTP(req, res, next) {
        try{
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
                return
            }
    
    
            if (findUser.otp && !(await findUser.correctOTP(otp, findUser.otp))) {
                res.status(400).json({
                    status: 'error',
                    message: 'OTP is incorrect'
                })
                return
            }
    
    
            findUser.verified = true
            findUser.otp = undefined
            findUser.otpExpiredTime = undefined
    
            await findUser.save({
                new: true,
                validateModifiedOnly: true
            })
    
            const token = generateToken(findUser._id)
            console.log(token, findUser._id)
            res.status(200).json({
                status: 'succes',
                message: 'Logged is successfully',
                token
            })
        }catch(err){
            next(err)
        }

    }

    async forgotPassword(req, res, next) {
        try{
            const { email } = req.body
            const findUser = await User.findOne({email})
            if (!findUser) {
                res.status(400).json({
                    status: 'error',
                    message: 'Email not found'
                })
                return
            }
    
            const resetToken = findUser.createResetPasswordToken()
    
            await findUser.save({
                validateModifiedOnly:true
            })
    
            try {
                // send email reset password
                const resetURL = `http://localhost:3000/auth/new-password?token=${resetToken}`
    
                sendRSMail({
                    from: 'onboarding@resend.dev',
                    to: 'renyk97@gmail.com',
                    subject: 'Reset Password',
                    html: `<p>Reset link: <strong>${resetURL}</strong>!</p>`
                })
    
                res.status(200).json({
                    status: 'success',
                    message: 'reset password sent to your email'
                })
            } catch (err) {
                User.passwordResetToken = undefined
                User.passwordResetExpires = undefined
    
    
    
                res.status(500).json({
                    status: 'error',
                    message: 'Error Sending Email'
                })
            }
        }catch(err){
            next(err)
        }
    }

    async resetPassword(req, res, next) {
        try{
            const hashedToken = crypto.createHash('sha256').update(req.body.token).digest('hex')
    
            const findUser = await User.findOne({
                passwordResetToken: hashedToken,
                passwordResetExpires: { $gt: Date.now() }
            })
    
            if (!findUser) {
                res.status(400).json({
                    status: 'error',
                    message: 'Token is expired or invalid'
                })
                return
            }
    
            findUser.password = req.body.password
            findUser.confirmPassword = req.body.confirmPassword
            findUser.passwordResetToken = undefined
            findUser.passwordResetExpires = undefined
    
            await findUser.save()
    
            const token = generateToken(User._id)
            //Send an email to inform new password
    
            res.status(200).json({
                status: 'success',
                message: 'Password reset successfully',
                token
            })

        }catch(err){
            next(err)

        }
    }

    async protect(req, res, next) {
        try{
            let token
            if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
                token = req.header.authorization.split(' ')[1]
            } else if (req.cookies.jwt) {
                token = req.cookies.jwt
            }
    
            if (!token) {
                res.status(401).json({
                    status: 'error',
                    message: 'You are not logged in! Please log in to get access.'
                })
                return
            }
    
            const decoded = await promisify(jwt.verify)(token, process.env.SECRET_KEY);
    
            const findUser = await User.findById(decoded.userID)
    
            if (!findUser) {
                res.status(400).json({
                    status: 'error',
                    message: "User doesn't exist"
                })
                return
            }
    
            if (findUser.changedPasswordAfter(decoded.iat)) {
                res.status(400).json({
                    status: 'error',
                    message: 'User recently changed password. Please log in again!'
                })
            }
    
            req.user = findUser
            next()
        }catch(err){
            next(err)
        }

    }
}

module.exports = new AuthController()