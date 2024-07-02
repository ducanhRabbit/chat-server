const authController = require('../controllers/AuthController')

const router = require('express').Router()

router.post('/login',authController.login)
router.post('/register',authController.register)
router.post('/sendOtp',authController.sendOTP)
router.post('/verifyOtp',authController.verifiedOTP)
router.post('/forgotPassword',authController.forgotPassword)
router.post('/resetPassword',authController.resetPassword)

module.exports = router