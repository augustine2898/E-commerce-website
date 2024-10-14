const { log } = require('console');
const express= require('express');
const path = require('path');
const app = express();
const hbs =require('hbs');
const nocache= require('nocache')
const session = require('express-session');
const mongoose = require('mongoose');
const userRoute =require('./Routes/user')
const adminRoute=require('./Routes/admin')

require('./script/createAdmin')();

app.use(nocache());
app.use(express.urlencoded({extended:true}));
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

app.set ('view engine' ,'hbs');





app.use(session({
    secret:'my-secret-key',
    resave:false,
    saveUninitialized:true,
    cookie:{secure:false}
}));



app.use('/',userRoute)
app.use('/admin',adminRoute)



mongoose.connect('mongodb://localhost:27017/myapp')
    .then(() => {console.log('Connected to MongoDB')})
    .catch((err) => {console.error('MongoDB connection error:', err)});

  



app.listen(3002,() => console.log('Server running on port 3002'));