const express = require("express");
const PORT = 4000;
const app = express();

app.get("/", (req, res: any)=>{
    res.end("Working")
})

app.listen(PORT, ()=>{
    console.log(`App is listening at http://localhost:${PORT}`)
})