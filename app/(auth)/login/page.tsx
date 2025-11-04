export default function login(){
    return(
        <>
        hoperxpharma login

        <form>
            <label htmlFor="name">Email</label>
            <input id="name" type="text" />
            <br />
            <label htmlFor="password">Password</label>
            <input type="password" />
            <button className="hover:cursor-pointer" type="submit">Submit</button>
        </form>
        </>
    )
}