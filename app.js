const express = require('express');
const app = express();
const path = require('path');
const passport =require("./config/passport");
const session = require("express-session");
const MongoStore = require('connect-mongo');
const env = require("dotenv").config();
const db = require('./config/db');
const userRouter = require("./routes/userRouter");
const adminRouter =require ("./routes/adminRouter");
db();

app.use(express.json());
app.use(express.urlencoded({ extended: true }))
app.use(session({
    secret:process.env.SESSION_SECRET,
    resave:false,
    saveUninitialized:true,
    cookie:{
        secure:false,
        httpOnly:true,
        maxAge:72*60*60*1000

    },
    store: MongoStore.create({mongoUrl:process.env.MONGODB_URI})
}))

app.use(passport.initialize());
app.use(passport.session());


app.use((req,res,next)=>{
    res.set('cache-control','no-store')
    next();
});

app.set("view engine", 'ejs');
app.set('views', [path.join(__dirname, 'views/user'), path.join(__dirname, 'views/admin')]);
app.use(express.static(path.join(__dirname, "public")));

app.use("/",userRouter);
app.use("/admin",adminRouter);

const PORT =process.env.PORT || 4000
app.listen(process.env.PORT, () => {
    console.log(`Server Running at ${PORT}`);
});

module.exports = app