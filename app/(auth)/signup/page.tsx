"use client"
import { useState } from "react"

export default function Signup(){
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    
    return(
        <>
        Signup
        hoperxpharma Signup
        
        <form action="post">
            <label htmlFor="name">Name</label>
            <input type="text" name="name" id="name" onChange={(e: any)=> setName(e.target.value)} value={name} />
            <br />
            <label htmlFor="name">Email</label>
            <input id="name" type="text" onChange={(e: any)=> setEmail(e.target.value)} value={email} />
            <br />
            <label htmlFor="password">Password</label>
            <input type="password" onChange={(e: any)=> setPassword(e.target.value)} value={password} />
            <br />
            <label htmlFor="password">Confirm Password</label>
            <input type="password" onChange={(e: any)=> setConfirmPassword(e.target.value)} value={confirmPassword} />
            <button className="hover:cursor-pointer" type="submit">Submit</button>
        </form>
        </>
    )
}