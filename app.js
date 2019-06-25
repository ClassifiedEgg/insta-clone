var express = require("express"),
  app = express(),
  mongoose = require("mongoose"),
  bodyParser = require("body-parser"),
  User = require("./models/user"),
  Post = require("./models/post"),
  session = require("express-session"),
  passport = require("passport"),
  methodOverride = require("method-override"),
  LocalStrategy = require("passport-local"),
  isImageUrl = require("is-image-url");

mongoose.connect("mongodb://localhost:27017/instaclone", {
  useNewUrlParser: true
});

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));

app.use(
  session({
    secret: "first rule of seceret is dont tell anyone",
    resave: false,
    saveUninitialized: false
  })
);
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  next();
});

//========================= LANDING PAGE =========================
app.get("/", function(req, res) {
  res.render("landing");
  console.log(req.user);
});

//========================= SIGNUP PAGE =========================
app.get("/register", function(req, res) {
  res.render("user/signup");
  console.log(req.body.user);
});

app.post("/register", function(req, res) {
  var newUser = new User({
    username: req.body.username,
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    avatar: req.body.avatar
  });
  User.register(newUser, req.body.password, function(err, user) {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function() {
        res.redirect("/");
      });
    }
  });
});

//========================= LOGIN PAGE =========================
app.get("/login", function(req, res) {
  res.render("user/login");
});

app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login"
  }),
  function(req, res) {}
);

//========================= LOGOUT ROUTE =========================
app.get("/logout", function(req, res) {
  req.logout();
  res.redirect("/");
});

//========================= MAIN USER PAGE =========================
app.get("/:id", function(req, res) {
  User.findById(req.params.id)
    .populate("posts")
    .exec(function(err, foundUser) {
      if (err) {
        console.log(err);
      } else {
        res.render("user/main", { user: foundUser });
      }
    });
});

//========================= NEW POST PAGE =========================
app.post("/:id", isUser, function(req, res) {
  User.findById(req.params.id, function(err, foundUser) {
    if (err) {
      console.log(err);
    } else {
      var newPost = new Post({
        image: req.body.imageurl,
        caption: req.body.caption
      });
      Post.create(newPost, function(err, madePost) {
        madePost.author.id = req.user._id;
        madePost.author.username = req.user.username;
        madePost.save();
        foundUser.posts.push(madePost);
        foundUser.save();
        res.redirect("/" + foundUser._id);
      });
    }
  });
});

app.get("/:id/new", isLoggedIn, function(req, res) {
  res.render("post/new");
});

//========================= EDIT USER PAGE =========================
app.get("/:id/edit", isUser, function(req, res) {
  User.findById(req.params.id, function(err, foundUser) {
    if (err) {
      res.redirect("back");
    } else {
      res.render("user/edit", { user: foundUser });
    }
  });
});

app.put("/:id", isUser, function(req, res) {
  var updatedUser = {
    username: req.body.username,
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    avatar: req.body.avatar
  };
  User.findByIdAndUpdate(req.params.id, { $set: updatedUser }, function(
    err,
    postUpdateUser
  ) {
    if (err) {
      console.log(err);
    } else {
      res.redirect("/" + postUpdateUser._id);
    }
  });
});

//========================= LIKED POSTS PAGE =========================
app.get("/:id/liked", isUser, function(req, res) {
  User.findById(req.params.id)
    .populate("likedPosts")
    .exec(function(err, foundUser) {
      if (err) {
        console.log(err);
      } else {
        res.render("user/liked", { user: foundUser });
      }
    });
});

//========================= SHOW POST PAGE =========================
app.get("/:id/post/:postid", function(req, res) {
  User.findById(req.params.id, function(err, foundUser) {
    if (err) {
      console.log(err);
      res.redirect("back");
    } else {
      Post.findById(req.params.postid, function(err, foundPost) {
        if (err) {
          console.log(err);
          res.redirect("back");
        } else {
          var isPostLiked = foundUser.likedPosts.indexOf(foundPost._id);
          res.render("post/show", {
            user: foundUser,
            post: foundPost,
            isPostLiked: isPostLiked
          });
        }
      });
    }
  });
});

//========================= EDIT POST PAGE =========================
app.get("/:id/post/:postid/edit", isUserOwnerOfPost, function(req, res) {
  Post.findById(req.params.postid, function(err, foundPost) {
    res.render("post/edit", { post: foundPost });
  });
});

app.put("/:id/post/:postid", isUserOwnerOfPost, function(req, res) {
  var updatedPost = {
    caption: req.body.caption
  };
  Post.findByIdAndUpdate(req.params.postid, { $set: updatedPost }, function(
    err,
    postUpdatedPost
  ) {
    if (err) {
      console.log(err);
      res.redirect("back");
    } else {
      res.redirect("/" + req.params.id + "/post/" + req.params.postid);
    }
  });
});

//========================= DELETE POST PAGE =========================
app.delete("/:id/post/:postid", isUserOwnerOfPost, function(req, res) {
  Post.findByIdAndRemove(req.params.postid, function(err) {
    if (err) {
      console.log(err);
    } else {
      res.redirect("/" + req.params.id);
    }
  });
});

//========================= LIKE POST ROUTE =========================
app.post("/:id/post/:postid/like", function(req, res) {
  User.findById(req.params.id, function(err, foundUser) {
    if (err) {
      console.log(err);
    } else {
      Post.findById(req.params.postid, function(err, foundPost) {
        if (err) {
          console.log(err);
        } else {
          foundPost.author.id = req.user._id;
          foundPost.author.username = req.user.username;
          foundPost.save();
          foundUser.likedPosts.push(foundPost);
          foundUser.save();
          res.redirect("/" + foundUser._id + "/post/" + foundPost._id);
        }
      });
    }
  });
});

//========================= UNLIKE POST ROUTE =========================
app.post("/:id/post/:postid/unlike", function(req, res) {
  User.findById(req.params.id, function(err, foundUser) {
    if (err) {
      console.log(err);
    } else {
      Post.findById(req.params.postid, function(err, foundPost) {
        if (err) {
          console.log(err);
        } else {
          var isPostLiked = foundUser.likedPosts.indexOf(foundPost._id);
          foundUser.likedPosts.splice(isPostLiked, 1);
          foundUser.save();
          res.redirect("/" + foundUser._id + "/post/" + foundPost._id);
        }
      });
    }
  });
});

//========================= MIDDLEWARE =========================
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    next();
  } else {
    res.redirect("/login");
  }
}

function isUser(req, res, next) {
  if (req.isAuthenticated()) {
    User.findById(req.params.id, function(err, foundUser) {
      if (err) {
        res.redirect("back");
      } else {
        if (foundUser._id.equals(req.user._id)) {
          next();
        } else {
          res.redirect("back");
        }
      }
    });
  } else {
    res.redirect("/login");
  }
}

function isUserOwnerOfPost(req, res, next) {
  if (req.isAuthenticated()) {
    Post.findById(req.params.postid, function(err, foundPost) {
      if (err) {
        res.redirect("back");
      } else {
        if (foundPost.author.id.equals(req.user._id)) {
          next();
        } else {
          res.redirect("back");
        }
      }
    });
  } else {
    res.redirect("/login");
  }
}

app.listen(3000, process.env.IP, function() {
  console.log("The server has started");
});
