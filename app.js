require("dotenv").config();
let express = require("express");
let bodyParser = require("body-parser");
let ejs = require("ejs");
let session = require("express-session");
let passport = require("passport");
let passportLocalMongoose = require("passport-local-mongoose");

let { mongoose, userSchema } = require("./database.js");
let app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(session({secret: process.env.SECRET, resave: false, saveUninitialized: false}));
app.use(passport.initialize());
app.use(passport.session());

userSchema.plugin(passportLocalMongoose);
let User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", function(req, res) {
    if(req.isAuthenticated()) {
        res.redirect("/browse");
    } else {
        res.render("home");
    }
});

app.get("/login", function(req, res) {
    res.render("login");
});

app.get("/register", function(req, res) {
    res.render("register");
});

app.get("/browse", function(req, res) {
    if(req.isAuthenticated()) {
        res.render("browse");
    } else {
        res.redirect("/");
    }
});

app.get("/profile", function(req, res) {
    res.render("profile");
});

app.get("/create", function(req, res) {
    res.render("create");
});

app.get("/logout", function(req, res) {
    req.logout();
    res.redirect("/");
})

app.post("/register", function(req, res) {
    User.register({username: req.body.username}, req.body.password, function(err, user) {
        if(err) {
            console.log(err);
            res.redirect("/register");
        } else {
            passport.authenticate("local")(req, res, function() {
                res.redirect("/browse");
            }) 
        }
    })
});

app.post("/login", function(req, res) {
    let user = new User({
        username: req.body.username,
        password: req.body.password
    });
    req.login(user, function(err) {
        if(err) {
            console.log(err);
        } else {
            passport.authenticate("local")(req, res, function() {
                res.redirect("/browse");
            });
        }
    });
});

app.listen(3000, function() {
    console.log("Server started on port 3000");
})