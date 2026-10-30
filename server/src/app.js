const express = require("express");
const cors = require("cors");
const app = express();

const reconRoute = require('./routes/recon');

const PORT = 4000;

app.use(express.json());
app.use(cors());
app.use('/api/recon', reconRoute);

app.get("/api/home", (req, res)=>{
    res.status(200).json({
        "status" : "success",
        "message" : "Server Up & Running",
    });
});

module.exports = app;