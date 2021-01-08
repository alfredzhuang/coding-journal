let express = require("express");
let bodyParser = require("body-parser");
let ejs = require("ejs");

let app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));

app.get("/", function(req, res) {
    res.render("home");
});

app.get("/login", function(req, res) {
    res.render("login");
});

app.get("/register", function(req, res) {
    res.render("register");
});

app.get("/browse", function(req, res) {
    res.render("browse");
});

app.get("/profile", function(req, res) {
    res.render("profile");
});

app.get("/create", function(req, res) {
    res.render("create");
});

app.listen(3000, function() {
    console.log("Server started on port 3000");
})