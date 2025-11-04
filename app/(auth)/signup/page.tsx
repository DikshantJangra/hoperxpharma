"use client"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function Signup(){
    const [countryCode, setCountryCode] = useState("+91");
    const [number, setNumber] = useState();
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [err, setErr] = useState("")
    const router = useRouter();

    const signupuser = async (e: any)=>{

        // To implement forntend checks!
        e.preventDefault();
        setErr("")
        if(!name || !email || !password || !confirmPassword){
            setErr("All the fields are required!")
            return;
        }
        if(password !== confirmPassword){
            setErr("Passwords do not match!")
            return;
        }
        try{
            const fullNumber = countryCode + number;
            const res = await fetch("http://localhost:8000/signup", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({ name, email, password, confirmPassword, number: fullNumber })
            })
            const message = await res.json()
            setErr(message.message)
            console.log(`Res - `,res)
        }catch(err){
            if(err){
                setErr("Server Error")
                console.log(err)
            }
        }


    }
    return(
        <>
        Signup
        hoperxpharma Signup
        
        <form onSubmit={signupuser}>
            
            <br />
            <label htmlFor="number">Mobile Number</label>
            {/* <div style={{ display: 'flex' }}> */}
                <select value={countryCode} onChange={(e) => setCountryCode(e.target.value)}>
                    <option value="+91">+91</option>
                    <option value="+1">+1</option>
                    <option value="+44">+44</option>
                    <option value="+61">+61</option>
                </select>
                <input type="number" id="number" onChange={(e: any)=> setNumber(e.target.value)} value={number} placeholder="Mobile Number" />
            {/* </div> */}
            <br />
            <label htmlFor="name">Name</label>
            <input type="text" id="name" onChange={(e: any)=> setName(e.target.value)} value={name} />
            <br />
            <label htmlFor="email">Email</label>
            <input id="email" type="email" onChange={(e: any)=> setEmail(e.target.value)} value={email} />
            <br />
            <label htmlFor="password">Password</label>
            <input type="password" id="password" onChange={(e: any)=> setPassword(e.target.value)} value={password} />
            <br />
            <label htmlFor="confirmpassword">Confirm Password</label>
            <input type="password" id="confirmpassword" onChange={(e: any)=> setConfirmPassword(e.target.value)} value={confirmPassword} />
            <button className="hover:cursor-pointer" type="submit">Submit</button>
            {err && <p className="text-red-600">{err}</p>}
        </form>
        </>
    )
}
