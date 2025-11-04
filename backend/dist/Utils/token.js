import jwt from "jsonwebtoken";
import { JWT } from "@/constants";
export const generateToken = (payload) => {
    const accessTokens = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: JWT.ACCESS_TOKEN_EXPIRATION
    });
    const refreshToken = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: JWT.ACCESS_TOKEN_EXPIRATION
    });
    return { accessTokens, refreshToken };
};
export const verifyTokens = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    }
    catch (err) {
        return null;
    }
};
//# sourceMappingURL=token.js.map