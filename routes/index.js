var express = require('express');
var router = express.Router()
var passport = require('passport')
var userModel = require('./users')
const localStrategy = require("passport-local")
passport.use(new localStrategy(userModel.authenticate));
const multer = require("multer")
passport.use(userModel.createStrategy());
var path = require("path")
var postModel = require("./post")

function fileFilter(req, file, cb) {
  if (file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/webp') {
    cb(null, true)
  }
  else {
    cb(new Error('I don\'t have a clue!'))
  }
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/images/uploads')
  },
  filename: function (req, file, cb) {
    // var fn = Date.now()+Math.random()*1000000+file.originalname 
    var dt = new Date();
    var fn = Math.floor(Math.random() * 10000000) + dt.getTime() + path.extname(file.originalname)
    cb(null, fn);
  }
})

const upload = multer({ storage: storage, filefilter: fileFilter })

router.post('/uploads', isLoggedIn, upload.single("profileimage"), function (req, res, next) {
  userModel.findOne({ username: req.session.passport.user })
    .then(function (loggedinuser) {
      loggedinuser.profileimage = req.file.filename;
      loggedinuser.save()
        .then(function () {
          res.redirect("back");
        })
    })
});
//for multer code --> profile photos change/upload files (12 to 43 lines)

router.get('/', redirectToProfile, function (req, res, next) {
  res.render('index');
});

router.get('/profile', isLoggedIn, async function (req, res) {
  const user = await userModel
    .findOne({ username: req.session.passport.user })
    .populate({
      path: "post",
      populate: {
        path: "user"
      }
    })
  console.log(user)
  await user.save()
  res.render('profile', { user })
})

router.post('/post', isLoggedIn, async function (req, res, next) {
  loggedinuser = req.user
  userModel.findOne({ username: req.session.passport.user })
    .then(function (postuser) {
      postModel.create({
        postdets: req.body.postdets,
        user: loggedinuser._id,
      })
        .then(function (createdpost) {
          loggedinuser.post.push(createdpost._id);
          loggedinuser.save()
          res.redirect("back")
        })
    })
})
//create post pr click krne pr file post ho (notes)

router.get('/like/:id', isLoggedIn, async function (req, res, next) {
  let loggedinuser = await userModel.findOne({ username: req.session.passport.user })
  let likedpost = await postModel.findOne({ _id: req.params.id })
  if (likedpost.like.indexOf(loggedinuser._id) === -1) {
    likedpost.like.push(loggedinuser);
  }
  else {
    likedpost.like.splice(likedpost.like.indexOf(loggedinuser, 1))
  }
  await likedpost.save();
  res.redirect("back");
});
//for like -> userposts


router.get("/find/:username", isLoggedIn, function (req, res, next) {
  var regexp = new RegExp("^" + req.params.username);
  userModel.find({ username: regexp })
    .limit(5)
    .skip(5 * req.params.username)
    .then(function (allusers) {
      res.json({ allusers })
    })
})
//in searching --> we find usernames

router.get('/user/profile/:id', isLoggedIn, function (req, res, next) {
  userModel.findOne({ _id: req.params.id })
    .populate("post") //.populate krna tha userprofile open krne ke liye
    .then(function (userdets) {
      console.log(userdets)
      res.render("profile", { user: userdets })
    })
});
// in searching to --> profile open 

router.get("/check/:username", function (req, res, next) {
  userModel.findOne({ username: req.params.username })
    .then(function (foundUser) {
      if (foundUser) {
        res.json({ found: true })
      }
      else {
        res.json({ found: false })
      }
    })
});
//only new user can register
//in register > outline/submit => username find or not // axios send krna

router.get('/feed', isLoggedIn, async function (req, res, next) {
  let allposts = await postModel
    .find()
    .populate("user")
  console.log(allposts)
  res.render("feed", { post: allposts, loggedinuser: req.session.passport.user })
});
//to show --> allusers/posts in feed

router.get("/login", function (req, res) {
  res.render("login");
});
//rendering login page

router.post('/register', function (req, res, next) {
  var newUser = new userModel({
    username: req.body.username,
    email: req.body.email,
    profilepic: req.body.profileimage
  })
  userModel.register(newUser, req.body.password)
    .then(function () {
      passport.authenticate('local')(req, res, function () {
        res.redirect('/profile')
      })
    })
});
//user can register this express app

router.post("/login", passport.authenticate("local",
  {
    successRedirect: "/profile",
    failureRedirect: "/"
  }), function (req, res, next) { });
//existing user -> login

router.get('/logout', function (req, res, next) {
  req.logout(function (err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});
//logout

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  else {
    res.redirect("/");
  }
}
//for those loggedin who is authenticated or not

function redirectToProfile(req, res, next) {
  if (req.isAuthenticated()) {
    res.redirect("/profile")
  } else {
    return next()
  }
}
// if you are login then you dont go to register page when you click logout then you can go in register page

module.exports = router;
