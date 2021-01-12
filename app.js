let { v4: uuidv4 } = require("uuid");
require("dotenv").config();
let express = require("express");
let bodyParser = require("body-parser");
let { check, validationResult } = require("express-validator");
let ejs = require("ejs");
let session = require("express-session");
let passport = require("passport");
let passportLocalMongoose = require("passport-local-mongoose");

let { mongoose, userSchema, Post } = require("./database.js");
let app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 60000 * 60 * 24 * 365 * 10 },
  })
);
app.use(passport.initialize());
app.use(passport.session());

userSchema.plugin(passportLocalMongoose);
let User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", function (req, res) {
  if (req.isAuthenticated()) {
    res.redirect("/browse");
  } else {
    res.render("home");
  }
});

app
  .route("/login")
  .get(function (req, res) {
    res.render("login");
  })
  .post([
    check("username", "Email is not valid").isEmail().normalizeEmail(),
    check("password", "Password must be 5+ characters long")
      .exists()
      .isLength({ min: 5 }),
  ], function (req, res) {
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      let alert = errors.array();
      res.render("login", { alert: alert });
    }
    User.findOne({username : req.body.username}, function(err, user) {
        if(!user) {
            res.render("login", { alert: [{msg: "Username or password is incorrect"}]});
        } 
    })
    let user = new User({
      username: req.body.username,
      password: req.body.password,
    });
    req.login(user, function(err) {
        passport.authenticate("local", (err, user, info) => {
            if(!user && info) {
                res.render("login", { alert: [{msg: "Username or password is incorrect"}]})
            } else {
                res.redirect("/browse");
            }
        })(req, res);
    })
  });

app
  .route("/register")
  .get(function (req, res) {
    res.render("register");
  })
  .post(
    [
      check("username", "Email is not valid").isEmail().normalizeEmail(),
      check("password", "Password must be 5+ characters long")
        .exists()
        .isLength({ min: 5 }),
    ],
    function (req, res) {
      let errors = validationResult(req);
      if (!errors.isEmpty()) {
        let alert = errors.array();
        res.render("register", { alert: alert });
      } 
      User.findOne({username : req.body.username}, function(err, user) {
        if(user) {
            res.render("register", { alert: [{msg: "Username already exists"}]});
        } 
    })
      User.register(
        { username: req.body.username, createdAt: new Date().toLocaleDateString("en-US"), entries: 0 },
        req.body.password,
        function (err, user) {
          if (err) {
            res.redirect("/register");
          } else {
            passport.authenticate("local")(req, res, function () {
              res.redirect("/browse");
            });
          }
        }
      );
    }
  );

app.get("/browse", function (req, res) {
  if (req.isAuthenticated()) {
    Post.find({ userID: req.user._id }, function (err, posts) {
      res.render("browse", { posts: posts });
    });
  } else {
    res.redirect("/");
  }
});

app.get("/profile", function (req, res) {
  res.render("profile");
});

app.get("/create", function (req, res) {
  res.render("create");
});

app.get("/logout", function (req, res) {
  req.logout();
  res.redirect("/");
});

app.post("/create", function (req, res) {
  let post = new Post({
    userID: req.user._id,
    postID: uuidv4(),
    date: req.body.postDate,
    title: req.body.postTitle,
    content: req.body.postContent,
  });
  post.save(function (err) {
    if (!err) {
      res.redirect("/browse");
    }
  });
});

app.get("/posts/:postID", function (req, res) {
  if (req.user) {
    let requestedPostID = req.params.postID;
    Post.findOne(
      { $and: [{ postID: requestedPostID }, { userID: req.user._id }] },
      function (err, post) {
        if (post) {
          res.render("post", { post: post });
        } else {
          res.redirect("/browse");
        }
      }
    );
  } else {
    res.redirect("/");
  }
});

app.get("/posts/:postID/edit", function (req, res) {
  if (req.user) {
    let requestedPostID = req.params.postID;
    Post.findOne({ postID: requestedPostID }, function (err, post) {
      if (post) {
        res.render("edit", { post: post });
      } else {
        res.redirect("/browse");
      }
    });
  } else {
    res.redirect("/");
  }
});

app.post("/edit", function (req, res) {
  Post.updateOne(
    { postID: req.body.postID },
    {
      date: req.body.postDate,
      title: req.body.postTitle,
      content: req.body.postContent,
    },
    function (err) {
      res.redirect("/posts/" + req.body.postID);
    }
  );
});

app.post("/delete", function (req, res) {
  let requestedPostID = req.body.postID;
  Post.deleteOne({ postID: requestedPostID }, function (err) {
    res.redirect("/browse");
  });
});

app.get("*", function (req, res) {
  res.send("404 error message");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
