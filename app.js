const express = require('express')

const morgan = require('morgan')

const rateLimit = require('express-rate-limit')

const helmet = require('helmet')

const bodyParser = require('body-parser')

const mongoSanitize = require('express-mongo-sanitize')

const app = express()

app.use(express.json({ limit: "10kb" }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));