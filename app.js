let express = require("express");
let bodyParser = require("body-parser");
let ejs = require("ejs");

let app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));

app.listen(3000, function() {
    console.log("Server started on port 3000");
})