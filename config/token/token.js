const jwt = require("jsonwebtoken")

const generateToken = (payload)=>{
    jwt.sign({payload},process.env.SECRET_KEY,{expiresIn:'1d'})
}

module.exports = {generateToken}