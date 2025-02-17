let { v4: uuidv4 } = require("uuid");
require("dotenv").config();
let express = require("express");
let bodyParser = require("body-parser");
let { check, validationResult } = require("express-validator");
let ejs = require("ejs");
let session = require("express-session");
let passport = require("passport");
let passportLocalMongoose = require("passport-local-mongoose");
let flash = require("express-flash");
let isLoggedIn = require("./isLoggedIn");

let { mongoose, userSchema, Post } = require("./database.js");
let app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
app.use(
  session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 60000 * 60 * 24 * 365 * 10 },
  })
);
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

app.use(function (req, res, next) {
  res.locals.success_msg = req.flash("success_msg");
  next();
});

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
        res.render("login", { alert: alert });
      }
      User.findOne({ username: req.body.username }, function (err, user) {
        if (!user) {
          res.render("login", {
            alert: [{ msg: "Username or password is incorrect" }],
          });
        }
      });
      let user = new User({
        username: req.body.username,
        password: req.body.password,
      });
      req.login(user, function (err) {
        passport.authenticate("local", (err, user, info) => {
          if (!user && info) {
            res.render("login", {
              alert: [{ msg: "Username or password is incorrect" }],
            });
          } else {
            res.redirect("/browse");
          }
        })(req, res);
      });
    }
  );

app
  .route("/register")
  .get(function (req, res) {
    res.render("register");
  })
  .post(
    [
      check("username", "Email is not valid")
        .exists()
        .isEmail()
        .normalizeEmail(),
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
      User.findOne({ username: req.body.username }, function (err, user) {
        if (user) {
          res.render("register", {
            alert: [{ msg: "Username already exists" }],
          });
        }
      });
      let pic, picType;
      if (req.body.picture !== "") {
        let picture = JSON.parse(req.body.picture);
        pic = new Buffer.from(picture.data, "base64");
        picType = picture.type;
      }
      User.register(
        {
          username: req.body.username,
          createdAt: new Date().toLocaleDateString("en-US"),
          picture: pic,
          pictureType: picType,
        },
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

app.get("/browse", isLoggedIn, function (req, res) {
  Post.find({ userID: req.user._id }, function (err, posts) {
    res.render("browse", { posts: posts });
  });
});

app.get("/profile", isLoggedIn, function (req, res) {
  User.findOne({_id: req.user._id}, function(err, user) {
    res.render("profile", {user: user})
  })
});

app.get("/create", isLoggedIn, function (req, res) {
  res.render("create");
});

app.post("/create", isLoggedIn, function (req, res) {
  let post = new Post({
    userID: req.user._id,
    postID: uuidv4(),
    date: req.body.postDate,
    title: req.body.postTitle,
    content: req.body.postContent,
  });
  if (req.body.picture !== "") {
    let picture = JSON.parse(req.body.picture);
    post.picture = new Buffer.from(picture.data, "base64");
    post.pictureType = picture.type;
  }
  post.save(function (err) {
    if (!err) {
      res.redirect("/browse");
    }
  });
});

app.get("/posts/:postID", isLoggedIn, function (req, res) {
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

app.get("/posts/:postID/edit", isLoggedIn, function (req, res) {
  if (req.user) {
    let requestedPostID = req.params.postID;
    Post.findOne(
      { $and: [{ postID: requestedPostID }, { userID: req.user._id }] },
      function (err, post) {
        if (post) {
          res.render("edit", { post: post });
        } else {
          res.redirect("/browse");
        }
      }
    );
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
  let userID = req.body.userID;
  Post.deleteOne({ postID: requestedPostID }, function (err) {
    res.redirect("/browse");
  });
});

app.get("/logout", function (req, res) {
  req.logout();
  req.flash("success_msg", "You are logged out");
  res.redirect("/");
});

app.get("*", function (req, res) {
  res.send("404 error message");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
