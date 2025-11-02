const express = require("express");
const PORT = 5000;
const app = express();

app.get("/", (req, res)=>{
    res.end("Working")
})

app.listen(PORT, ()=>{
    console.log(`App is listening at http://localhost:${PORT}`)
})