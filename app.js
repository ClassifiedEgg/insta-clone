var express = require("express"),
    app = express(),
    mongoose = require("mongoose"),
    bodyParser = require("body-parser"),
    User = require("./models/user"),
    Post = require("./models/post"),
    session = require("express-session"),
    passport = require("passport"),
    LocalStrategy = require("passport-local");

mongoose.connect('mongodb://localhost:27017/instaclone', { useNewUrlParser: true });

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + "/public"));

app.use(session({
    secret: "first rule of seceret is dont tell anyone",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());


passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    next();
});


app.get("/", function (req, res) {
    res.render("landing");
});


app.get("/register", function (req, res) {
    res.render("signup");
    console.log(req.body.user);
});

app.post("/register", function (req, res) {
    var newUser = new User({
        username: req.body.username,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        avatar: req.body.avatar
    });
    User.register(newUser, req.body.password, function (err, user) {
        if (err) {
            console.log(err);
        } else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/");
            });
        }
    });
});

app.get("/login", function (req, res) {
    res.render("login");
})

app.post("/login", function (req, res) {
    passport.authenticate("local", function (err, user, info) {
        if (err) {
            console.log(err);
        }
        if (!user) {
            return res.redirect('/login');
        } else {
            req.logIn(user, function (err) {
                if (err) {
                    console.log(err);
                } else {
                    res.redirect("/");
                }
            });
        }
    })(req, res);
});

app.get("/logout", function (req, res) {
    req.logout();
    res.redirect("/");
});


app.get("/:id", function (req, res) {
    User.findById(req.params.id).populate("posts").exec(function (err, foundUser) {
        if (err) {
            console.log(err);
        } else {
            res.render("main", { user: foundUser });
        }
    });
});

app.post("/:id", function (req, res) {
    User.findById(req.params.id, function (err, foundUser) {
        if (err) {
            console.log(err);
        } else {
            var newPost = new Post({
                image: req.body.imageurl,
                caption: req.body.caption
            });
            Post.create(newPost, function (err, madePost) {
                madePost.author.id = req.user._id;
                madePost.author.username = req.user.username;
                madePost.save();
                foundUser.posts.push(madePost);
                foundUser.save();
                res.redirect("/");
            });
        }
    });
});

app.get("/:id/new", function (req, res) {
    res.render("new");
});



app.listen(3000, process.env.IP, function () {
    console.log("The server has satrted");
})
