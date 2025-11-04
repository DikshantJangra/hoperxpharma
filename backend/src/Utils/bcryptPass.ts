import bcrypt from "bcrypt";

const saltRounds = 12;

const hashPassword = async (password:any) =>{
    return await bcrypt.hash(password, saltRounds)
}

const verifyPassword = async (password:any, hashedPassword:any) =>{
    return await bcrypt.compare(password, hashedPassword)
}

export {hashPassword, verifyPassword};