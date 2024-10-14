const express = require('express');
const app = express();
const path = require('path');
const hbs=require('hbs');
const tempelatePath =path.join(__dirname,'')

app.use(express.json());
app.use(express.urlencoded({extended:true}));

app.set("view engine",'hbs');



app.get('/',(req,res)=>{
    res.render('login');
});

app.get('/signup',(req,res)=>{
    res.render('signup');
})
app.listen(3000, () => {
    console.log("port connected to 3000");
});