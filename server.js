const express = require("express")
const ejs = require("ejs")
const mongoose = require("mongoose")
const passport = require('passport')
const session = require('express-session')
const passportLocalMongoose = require('passport-local-mongoose')
const { Strategy, serializeUser } = require("passport")
require('dotenv').config()

const saltRounds = 10
const app = express()


app.use(express.static("public"))
app.set('view engine', 'ejs')
app.use(express.urlencoded({
  extended: true
}))


app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false
}))
app.use(passport.initialize())
app.use(passport.session())

mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true })


const userSchema = new mongoose.Schema({
  email: String,
  password: String
})

userSchema.plugin(passportLocalMongoose)

const User = new mongoose.model("User", userSchema)

passport.use(User.createStrategy())
passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())

app.get("/", function (req, res) {
  res.render("home")
})

app.get("/login", function (req, res) {
  res.render("login")
})

app.get("/register", function (req, res) {
  res.render("register")
})

app.get('/secrets', (req, res) => {
  req.isAuthenticated() ? res.render("secrets") : res.redirect('/login')
})

app.get("/logout",(req,res)=>{
  req.logout()
  res.redirect("/")
})

app.post('/register', (req, res) => {
  User.register({ username: req.body.username }, req.body.password, (err, user) => {
    if (err) {
      console.log(err.message)
      res.redirect('/register')
    }
    else {
      passport.authenticate("local")(req, res, () => {

        res.redirect('/secrets')

      })
    }
  })
})

app.post('/login',(req,res)=>{
  const user = new User({
    username: req.body.username,
    password: req.body.password
  })
  req.login(user,(err)=>{
    if(err)
      console.log(err.message)
    else{
      passport.authenticate("local")(req,res,()=>{
        res.redirect('/secrets')
      })
    }
  })
})



app.listen(3000, function () {
  console.log("Server started on port 3000.")
})
