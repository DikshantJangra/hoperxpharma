import jwt from "jsonwebtoken";
export declare const generateToken: (payload: any) => {
    accessTokens: string;
    refreshToken: string;
};
export declare const verifyTokens: (token: string) => string | jwt.JwtPayload | null;
//# sourceMappingURL=token.d.ts.map