const express = require('express')

const morgan = require('morgan')

const rateLimit = require('express-rate-limit')

const app = express()

const helmet = require('helmet')

const mongoSanitize = require('express-mongo-sanitize')

const cors = require('cors')

const express = require('express')
const bodyParser = require('body-parser')
const morgan = require('morgan')

app.use(express.json({limit:'100kb'}))

app.use(cors({
    origin: '*',
    methods: ["GET", "PATCH", "POST", "DELETE", "PUT"],
    credentials: true
}))

app.use(bodyParser.json())

app.use(bodyParser.urlencoded({extended:'true'}))

app.use(helmet())
if(process.env.NODE_ENV === 'development'){
    app.use(morgan('dev'))
}

// Prevent DDOS attack
const limiter = rateLimit({
    max: 3000, // limite amount of request
    windowMS: 60 * 60 * 1000, //block in 1 hour
    message: 'Too many request from this IP'
})

module.exports = app