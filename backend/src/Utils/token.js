const jwt = require("jsonwebtoken");
const { JWT } = require("../constants/index.js");

const generateToken = (userId)=>{
    const payload = { userId };
    const accessTokens = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: JWT.ACCESS_TOKEN_EXPIRATION
    })
    const refreshToken = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: JWT.REFRESH_TOKEN_EXPIRATION
    })

    return { accessTokens, refreshToken }
}

const verifyTokens = (token) =>{
    try{
        return jwt.verify(token, process.env.JWT_SECRET)
    }
    catch(err){
        return null
    }
}

module.exports = { generateToken, verifyTokens };