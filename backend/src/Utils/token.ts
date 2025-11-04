import jwt from "jsonwebtoken";
import { JWT } from "@/constants";

export const generateToken = (payload: any)=>{
    const accessTokens = jwt.sign(payload, process.env.JWT_SECRET!, {
        expiresIn: JWT.ACCESS_TOKEN_EXPIRATION
    })
    const refreshToken = jwt.sign(payload, process.env.JWT_SECRET!, {
        expiresIn: JWT.ACCESS_TOKEN_EXPIRATION
    })

    return { accessTokens, refreshToken }
}

export const verifyTokens = (token: string) =>{
    try{
        return jwt.verify(token, process.env.JWT_SECRET!)
    }
    catch(err){
        return null
    }
}