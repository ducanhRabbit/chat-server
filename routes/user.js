const AuthController = require('../controllers/AuthController')
const UserController = require('../controllers/UserController')

const router = require('express').Router()

router.post('/updateMe', AuthController.protect,UserController.updateMe)

module.exports = router