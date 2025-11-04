import prisma from "@/db/prisma";
import { hashPassword } from "@/Utils/bcryptPass";
import { generateToken } from "@/Utils/token";
import { Request, Response } from "express"

export const signupUser = async (req: Request, res: Response)=>{
    const { name, email, phoneNumber, password, confrimPassword } = req.body();
    if(!name || !email || !phoneNumber || !password || !confrimPassword){
        return res.status(400).json({message: "All fields bro!"})
    }
    if(password !== confrimPassword){
        return res.status(400).json({message: "Passwords do not match bro!"})
    }
    
    try{
        const existingUser = await prisma.users.findFirst({
            where: {email}
        })
        if(existingUser){
            return res.status(400).json({message: "Try with another email and phone number bro!"})
        }

        const hashedPassword = hashPassword(password);
        const newUser = await prisma.user.create({
            data:{
                name,
                email,
                password: hashedPassword
            }
        })
        const token = generateToken(newUser.id);
        return res.status(201).json({message: `New user created bro! JWT: ${token}`})
    }catch(err){
        return res.status(500).json({message: "Server Error bro!"})
    }
}