const { log } = require('console');
const express= require('express');
const app = express();
const hbs =require('hbs');
const nocache= require('nocache')
const session = require('express-session');
app.use(express.static('public'));
app.set ('view engine' ,'hbs');

app.use(express.urlencoded({extended:true}));
app.use(express.json());

const userRoute =require('./Routes/user')

app.use(session({
    secret:'keyboard cat',
    resave:false,
    saveUninitialized:true,
}));

app.use(nocache());

app.use('/',userRoute)



app.listen(3003,() => console.log('Server running on port 3003'));