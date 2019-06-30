var express = require("express"),
  app = express(),
  mongoose = require("mongoose"),
  bodyParser = require("body-parser"),
  User = require("./models/user"),
  Post = require("./models/post"),
  Comment = require("./models/comment"),
  session = require("express-session"),
  passport = require("passport"),
  methodOverride = require("method-override"),
  LocalStrategy = require("passport-local");

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
app.get("/", isLoggedIn, function(req, res) {
  User.findOne({ username: req.user.username })
    .populate({ path: "following", populate: { path: "posts" } })
    .exec(function(err, foundUser) {
      if (err) {
        console.log(err);
      } else {
        res.render("landing", { user: foundUser });
      }
    });
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
app.get("/logout", isLoggedIn, function(req, res) {
  req.logout();
  res.redirect("/");
});

//========================= SEARCH ROUTE =========================
app.get("/search", function(req, res) {
  var nameRegex = new RegExp(req.query.search);
  User.find({ username: {$regex: nameRegex, $options: 'i'} }, function(err, foundUsers) {
    if (err) {
      console.log(err);
    } else {
      console.log(req.query.search + " ============");
      console.log(foundUsers + " ++++++++++ ");
      res.render("search/users", {foundUsers: foundUsers});
    }
  });
});

//========================= MAIN USER PAGE =========================
// app.get("/:id", function(req, res) {
//   User.findById(req.params.id)
//     .populate("posts")
//     .exec(function(err, foundUser) {
//       if (err) {
//         console.log(err);
//       } else {
//         console.log(foundUser + "=======++++======");
//         if (req.user) {
//           var isUserFollowed = req.user.following.indexOf(req.params.id);
//           //console.log(req.body.user);
//           res.render("user/main", {
//             user: foundUser,
//             isUserFollowed: isUserFollowed
//           });
//         } else {
//           res.render("user/main", {
//             user: foundUser,
//             isUserFollowed: -1
//           });
//         }
//       }
//     });
// });

app.get("/:uName", function(req, res) {
  var userName = req.params.uName;
  User.findOne({ username: userName })
    .populate("posts")
    .exec(function(err, foundUser) {
      if (err) {
        return console.log(err);
      } else {
        if (foundUser) {
          foundUser
            ? console.log("yes===========================")
            : console.log("no============================");
          var foundUser = foundUser;
          console.log(foundUser);
          if (req.user) {
            var isUserFollowed = foundUser.followers.indexOf(req.user._id);

            res.render("user/main", {
              user: foundUser,
              isUserFollowed: isUserFollowed
            });
          } else {
            console.log("+++++++++++++++++ no uesr logged in ++++++++++++++++");
            res.render("user/main", {
              user: foundUser,
              isUserFollowed: -1
            });
          }
        } else {
          res.redirect("back");
        }
      }
    });
});

//========================= NEW POST PAGE =========================
// app.post("/:id", isUser, function(req, res) {
//   User.findById(req.params.id, function(err, foundUser) {
//     if (err) {
//       console.log(err);
//     } else {
//       var newPost = new Post({
//         image: req.body.imageurl,
//         caption: req.body.caption
//       });
//       Post.create(newPost, function(err, madePost) {
//         madePost.author.id = req.user._id;
//         madePost.author.username = req.user.username;
//         madePost.save();
//         foundUser.posts.push(madePost);
//         foundUser.save();
//         res.redirect("/" + foundUser._id);
//       });
//     }
//   });
// });

app.post("/:uName", isLoggedIn, function(req, res) {
  User.findOne({ username: req.params.uName }, function(err, foundUser) {
    if (err) {
      console.log(err);
    } else {
      var newPost = new Post({
        image: req.body.imageurl,
        caption: req.body.caption
      });
      Post.create(newPost, function(err, madePost) {
        madePost.author.id = foundUser.id;
        madePost.author.username = foundUser.username;
        madePost.save();
        foundUser.posts.push(madePost);
        foundUser.save();
        res.redirect("/" + foundUser.username);
      });
    }
  });
});

// app.get("/:id/new", isLoggedIn, function(req, res) {
//   res.render("post/new");
// });

app.get("/:uName/new", isLoggedIn, function(req, res) {
  User.findOne({ username: req.params.uName }, function(err, foundUser) {
    if (err) {
      console.log(err);
    } else {
      res.render("post/new", { user: foundUser });
    }
  });
});

//========================= EDIT USER PAGE =========================
// app.get("/:id/edit", isUser, function(req, res) {
//   User.findById(req.params.id, function(err, foundUser) {
//     if (err) {
//       res.redirect("back");
//     } else {
//       res.render("user/edit", { user: foundUser });
//     }
//   });
// });

app.get("/:uName/edit", isLoggedIn, function(req, res) {
  User.findOne({ username: req.params.uName }, function(err, foundUser) {
    if (err) {
      res.redirect("back");
    } else {
      res.render("user/edit", { user: foundUser });
    }
  });
});

// app.put("/:id", isUser, function(req, res) {
//   var updatedUser = {
//     username: req.body.username,
//     firstName: req.body.firstName,
//     lastName: req.body.lastName,
//     email: req.body.email,
//     avatar: req.body.avatar
//   };
//   User.findByIdAndUpdate(req.params.id, { $set: updatedUser }, function(
//     err,
//     postUpdateUser
//   ) {
//     if (err) {
//       console.log(err);
//     } else {
//       res.redirect("/" + postUpdateUser._id);
//     }
//   });
// });

app.put("/:uName", isLoggedIn, function(req, res) {
  var updatedUser = {
    username: req.body.username,
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    avatar: req.body.avatar
  };
  User.findOneAndUpdate(
    { username: req.params.uName },
    { $set: updatedUser },
    function(err, postUpdateUser) {
      if (err) {
        console.log(err);
      } else {
        res.redirect("/" + postUpdateUser.username);
      }
    }
  );
});

//========================= LIKED POSTS PAGE =========================
// app.get("/:id/liked", isLoggedIn, function(req, res) {
//   User.findById(req.params.id)
//     .populate("likedPosts")
//     .exec(function(err, foundUser) {
//       if (err) {
//         console.log(err);
//       } else {
//         res.render("user/liked", { user: foundUser });
//       }
//     });
// });

app.get("/:uName/liked", isLoggedIn, function(req, res) {
  User.findOne({ username: req.params.uName })
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
// app.get("/:id/post/:postid", function(req, res) {
//   User.findById(req.params.id, function(err, foundUser) {
//     if (err) {
//       console.log(err);
//       res.redirect("back");
//     } else {
//       Post.findById(req.params.postid)
//         .populate("comments")
//         .exec(function(err, foundPost) {
//           if (err) {
//             console.log(err);
//             res.redirect("back");
//           } else {
//             var isPostLiked = foundUser.likedPosts.indexOf(foundPost._id);
//             res.render("post/show", {
//               user: foundUser,
//               post: foundPost,
//               isPostLiked: isPostLiked
//             });
//           }
//         });
//     }
//   });
// });

app.get("/:uName/post/:postid", function(req, res) {
  User.findOne({ username: req.params.uName }, function(err, foundUser) {
    if (err) {
      console.log(err);
      res.redirect("back");
    } else {
      Post.findById(req.params.postid)
        .populate("comments")
        .exec(function(err, foundPost) {
          if (err) {
            console.log(err);
            res.redirect("back");
          } else {
            if (req.user) {
              var isPostLiked = req.user.likedPosts.indexOf(foundPost._id);
              res.render("post/show", {
                user: foundUser,
                post: foundPost,
                isPostLiked: isPostLiked,
                currentUser: req.user
              });
            } else {
              res.render("post/show", {
                user: foundUser,
                post: foundPost,
                isPostLiked: -1
              });
            }
          }
        });
    }
  });
});

//========================= EDIT POST PAGE =========================
// app.get("/:id/post/:postid/edit", isUserOwnerOfPost, function(req, res) {
//   Post.findById(req.params.postid, function(err, foundPost) {
//     res.render("post/edit", { post: foundPost });
//   });
// });

app.get("/:uName/post/:postid/edit", isLoggedIn, function(req, res) {
  User.findOne({ username: req.params.uName }, function(err, foundUser) {
    if (err) {
      console.log(err);
    } else {
      Post.findById(req.params.postid, function(err, foundPost) {
        if (err) {
          console.log(err);
        } else {
          res.render("post/edit", { post: foundPost, user: foundUser });
        }
      });
    }
  });
});

// app.put("/:id/post/:postid", isUserOwnerOfPost, function(req, res) {
//   var updatedPost = {
//     caption: req.body.caption
//   };
//   Post.findByIdAndUpdate(req.params.postid, { $set: updatedPost }, function(
//     err,
//     postUpdatedPost
//   ) {
//     if (err) {
//       console.log(err);
//       res.redirect("back");
//     } else {
//       res.redirect("/" + req.params.id + "/post/" + req.params.postid);
//     }
//   });
// });

app.put("/:uName/post/:postid", isLoggedIn, function(req, res) {
  var updatedPost = {
    caption: req.body.caption
  };
  User.findOne({ username: req.body.params }, function(err, foundUser) {
    if (err) {
      console.log(err);
    } else {
      Post.findByIdAndUpdate(req.params.postid, { $set: updatedPost }, function(
        err,
        postUpdatedPost
      ) {
        if (err) {
          console.log(err);
          res.redirect("back");
        } else {
          res.redirect("/" + req.params.uName + "/post/" + req.params.postid);
        }
      });
    }
  });
});

//========================= DELETE POST PAGE =========================
// app.delete("/:id/post/:postid", isUserOwnerOfPost, function(req, res) {
//   Post.findByIdAndRemove(req.params.postid, function(err) {
//     if (err) {
//       console.log(err);
//     } else {
//       res.redirect("/" + req.params.id);
//     }
//   });
// });

app.delete("/:uName/post/:postid", isLoggedIn, function(req, res) {
  User.findOne({ username: req.params.uName }, function(err, foundUser) {
    if (err) {
      console.log(err);
    } else {
      Post.findByIdAndRemove(req.params.postid, function(err) {
        if (err) {
          console.log(err);
        } else {
          res.redirect("/" + foundUser.username);
        }
      });
    }
  });
});

//========================= LIKE POST ROUTE =========================
// app.post("/:id/post/:postid/like", isLoggedIn, function(req, res) {
//   User.findById(req.user.id, function(err, foundUser) {
//     if (err) {
//       console.log(err);
//     } else {
//       Post.findById(req.params.postid, function(err, foundPost) {
//         if (err) {
//           console.log(err);
//         } else {
//           foundUser.likedPosts.push(foundPost);
//           foundUser.save();
//           res.redirect("/" + foundUser._id + "/post/" + foundPost._id);
//         }
//       });
//     }
//   });
// });

app.post("/:uName/post/:postid/like", isLoggedIn, function(req, res) {
  User.findOne({ username: req.params.uName }, function(err, foundUser) {
    if (err) {
      console.log(err);
    } else {
      Post.findById(req.params.postid, function(err, foundPost) {
        if (err) {
          console.log(err);
        } else {
          req.user.likedPosts.push(foundPost);
          req.user.save();
          res.redirect("/" + foundUser.username + "/post/" + foundPost._id);
        }
      });
    }
  });
});

//========================= UNLIKE POST ROUTE =========================
// app.post("/:id/post/:postid/unlike", isLoggedIn, function(req, res) {
//   User.findById(req.user.id, function(err, foundUser) {
//     if (err) {
//       console.log(err);
//     } else {
//       Post.findById(req.params.postid, function(err, foundPost) {
//         if (err) {
//           console.log(err);
//         } else {
//           var isPostLiked = foundUser.likedPosts.indexOf(foundPost._id);
//           foundUser.likedPosts.splice(isPostLiked, 1);
//           foundUser.save();
//           res.redirect("/" + foundUser._id + "/post/" + foundPost._id);
//         }
//       });
//     }
//   });
// });

app.post("/:uName/post/:postid/unlike", isLoggedIn, function(req, res) {
  User.findOne({ username: req.params.uName }, function(err, foundUser) {
    if (err) {
      console.log(err);
    } else {
      Post.findById(req.params.postid, function(err, foundPost) {
        if (err) {
          console.log(err);
        } else {
          var isPostLiked = foundUser.likedPosts.indexOf(foundPost._id);
          req.user.likedPosts.splice(isPostLiked, 1);
          req.user.save();
          res.redirect("/" + req.params.uName + "/post/" + foundPost._id);
        }
      });
    }
  });
});

//========================= NEW COMMENT PAGE =========================
// app.get("/:id/post/:postid/comment/new", isLoggedIn, function(req, res) {
//   Post.findById(req.params.postid, function(err, foundPost) {
//     if (err) {
//       res.redirect("back");
//     } else {
//       res.render("comment/new", { post: foundPost });
//     }
//   });
// });

// app.post("/:id/post/:postid/comment", isLoggedIn, function(req, res) {
//   Post.findById(req.params.postid, function(err, foundPost) {
//     if (err) {
//       res.redirect("back");
//     } else {
//       var newComment = new Comment({
//         text: req.body.text
//       });
//       Comment.create(newComment, function(err, madeComment) {
//         if (err) {
//           res.redirect("back");
//         } else {
//           madeComment.author.id = req.user._id;
//           madeComment.author.username = req.user.username;
//           madeComment.save();
//           foundPost.comments.push(madeComment);
//           foundPost.save();
//           res.redirect("/" + req.params.id + "/post/" + foundPost._id);
//         }
//       });
//     }
//   });
// });

app.post("/:uName/post/:postid/comment", isLoggedIn, function(req, res) {
  User.findOne({ username: req.params.uName }, function(err, foundUser) {
    if (err) {
      console.log(err);
    } else {
      if (foundUser) {
        Post.findById(req.params.postid, function(err, foundPost) {
          if (err) {
            res.redirect("back");
          } else {
            var newComment = new Comment({
              text: req.body.text
            });
            Comment.create(newComment, function(err, madeComment) {
              if (err) {
                res.redirect("back");
              } else {
                madeComment.author.id = req.user._id;
                madeComment.author.username = req.user.username;
                madeComment.save();
                foundPost.comments.push(madeComment);
                foundPost.save();
                res.redirect("/" + req.params.uName + "/post/" + foundPost._id);
              }
            });
          }
        });
      } else {
        res.redirect("back");
      }
    }
  });
});

//========================= EDIT COMMENT PAGE =========================
// app.get("/:id/post/:postid/comment/:commentid/edit", isLoggedIn, function(
//   req,
//   res
// ) {
//   Post.findById(req.params.postid, function(err, foundPost) {
//     if (err) {
//       res.redirect("back");
//     } else {
//       Comment.findById(req.params.commentid, function(err, foundComment) {
//         if (err) {
//           res.redirect("back");
//         } else {
//           res.render("comment/edit", {
//             post: foundPost,
//             comment: foundComment
//           });
//         }
//       });
//     }
//   });
// });

app.get("/:uName/post/:postid/comment/:commentid/edit", isLoggedIn, function(
  req,
  res
) {
  Post.findById(req.params.postid, function(err, foundPost) {
    if (err) {
      res.redirect("back");
    } else {
      Comment.findById(req.params.commentid, function(err, foundComment) {
        if (err) {
          res.redirect("back");
        } else {
          res.render("comment/edit", {
            post: foundPost,
            comment: foundComment
          });
        }
      });
    }
  });
});

// app.put("/:id/post/:postid/comment/:commentid", isLoggedIn, function(req, res) {
//   var updatedComment = {
//     text: req.body.text
//   };
//   Post.findById(req.params.postid, function(err, foundPost) {
//     if (err) {
//       res.redirect("back");
//     } else {
//       Comment.findByIdAndUpdate(
//         req.params.commentid,
//         { $set: updatedComment },
//         function(err, madeComment) {
//           if (err) {
//             res.redirect("back");
//           } else {
//             res.redirect("/" + req.params.id + "/post/" + foundPost._id);
//           }
//         }
//       );
//     }
//   });
// });

app.put("/:uName/post/:postid/comment/:commentid", isLoggedIn, function(
  req,
  res
) {
  var updatedComment = {
    text: req.body.text
  };
  Post.findById(req.params.postid, function(err, foundPost) {
    if (err) {
      res.redirect("back");
    } else {
      Comment.findByIdAndUpdate(
        req.params.commentid,
        { $set: updatedComment },
        function(err, madeComment) {
          if (err) {
            res.redirect("back");
          } else {
            res.redirect("/" + req.params.uName + "/post/" + foundPost._id);
          }
        }
      );
    }
  });
});

//========================= DELETE COMMENT PAGE =========================
// app.delete("/:id/post/:postid/comment/:commentid/delete", function(req, res) {
//   Comment.findByIdAndRemove(req.params.commentid, function(err) {
//     if (err) {
//       console.log(err);
//     } else {
//       res.redirect("/" + req.params.id + "/post/" + req.params.postid);
//     }
//   });
// });

app.delete(
  "/:uName/post/:postid/comment/:commentid/delete",
  isLoggedIn,
  function(req, res) {
    Comment.findByIdAndRemove(req.params.commentid, function(err) {
      if (err) {
        console.log(err);
      } else {
        res.redirect("/" + req.params.uName + "/post/" + req.params.postid);
      }
    });
  }
);

//========================= FOLLOW USER ROUTE =========================
// app.post("/:id/follow", isLoggedIn, function(req, res) {
//   User.findById(req.params.id, function(err, foundUser) {
//     if (err) {
//       console.log(err);
//       res.redirect("back");
//     } else {
//       req.user.following.push(foundUser);
//       foundUser.followers.push(req.user);
//       req.user.save();
//       foundUser.save();
//       res.redirect("/" + foundUser._id);
//     }
//   });
// });

app.post("/:uName/follow", isLoggedIn, function(req, res) {
  User.findOne({ username: req.params.uName }, function(err, foundUser) {
    if (err) {
      console.log(err);
      res.redirect("back");
    } else {
      req.user.following.push(foundUser);
      foundUser.followers.push(req.user);
      req.user.save();
      foundUser.save();
      res.redirect("/" + foundUser.username);
    }
  });
});

//========================= UNFOLLOW USER ROUTE =========================
// app.post("/:id/unfollow", isLoggedIn, function(req, res) {
//   User.findById(req.params.id, function(err, foundUser) {
//     if (err) {
//       res.redirect("back");
//     } else {
//       var isUserFollowed = req.user.following.indexOf(req.params.id);
//       var isUserFollowing = req.user.following.indexOf(req.params.id);
//       foundUser.followers.splice(isUserFollowing, 1);
//       foundUser.save();
//       req.user.following.splice(isUserFollowed, 1);
//       req.user.save();
//       res.redirect("/" + foundUser._id);
//     }
//   });
// });

app.post("/:uName/unfollow", isLoggedIn, function(req, res) {
  User.findOne({ username: req.params.uName }, function(err, foundUser) {
    if (err) {
      res.redirect("back");
    } else {
      var isUserFollowed = req.user.following.indexOf(req.params.id);
      var isUserFollowing = req.user.following.indexOf(req.params.id);
      foundUser.followers.splice(isUserFollowing, 1);
      foundUser.save();
      req.user.following.splice(isUserFollowed, 1);
      req.user.save();
      res.redirect("/" + foundUser.username);
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
    User.findById(req.params.uName, function(err, foundUser) {
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
        if (foundPost.author.username.equals(req.user.username)) {
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

function isUserOwnerOfComment(req, res, next) {
  if (req.isAuthenticated()) {
    Comment.findById(req.params.commentid, function(err, fountComment) {
      if (err) {
        res.redirect("back");
      } else {
        if (fountComment.author.username.equals(req.user.username)) {
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
