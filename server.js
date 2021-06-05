const express = require("express")
const ejs = require("ejs")
const mongoose = require("mongoose")
const passport = require('passport')
const session = require('express-session')
const passportLocalMongoose = require('passport-local-mongoose')
const { Strategy, serializeUser } = require("passport")
const findOrCreate = require('mongoose-findorcreate')
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
  password: String,
  googleId:String
})

userSchema.plugin(passportLocalMongoose)
userSchema.plugin(findOrCreate)
const User = new mongoose.model("User", userSchema)

passport.use(User.createStrategy())
passport.serializeUser((user,done)=>{
  done(null, user.id)
})
passport.deserializeUser((id, done)=> {
  User.findById(id, (err, user)=> {
    done(err, user);
  })
})


var GoogleStrategy = require('passport-google-oauth20').Strategy;

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/oauth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile)
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/", function (req, res) {
  res.render("home")
})

app.get("/login", function (req, res) {
  res.render("login")
})

app.get("/register", function (req, res) {
  res.render("register")
})

app.get('/secrets', passport.authenticate('google', { failureRedirect: '/login' }),
(req, res)=>
  // Successful authentication, redirect t9 main page.
  res.render('secrets')
)

app.get("/logout",(req,res)=>{
  req.logout()
  res.redirect("/")
})

app.get('/oauth/google/secrets',passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res)=>
    // Successful authentication, redirect home.
    res.render('secrets')
  )
//authenticate user with google oauth2.0
app.get('/auth/google', passport.authenticate("google", {scope:['profile']}))
    

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
