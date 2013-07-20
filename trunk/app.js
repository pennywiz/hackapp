////prova
var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , util = require('util')
  , http = require('http')
  , path = require('path')
  , mongo = require('mongodb') 
  , facebook = require('./fb-api');

var Server = mongo.Server,
    Db = mongo.Db,
    BSON = mongo.BSONPure;

var mongoUri = "mongodb://@localhost:27017/hackapp";

/*

mongo.Db.connect(mongoUri, function (err, db) {
  db.collection('places', function(err, collection) {
    collection.find({'city': city}).toArray(function(err, items) {
      if (err) {
            res.send({'error':'An error has occurred'});
      } else {
        res.send(items);
      }
    });
  });
});

*/
  
var app = express();

var passport = require('passport')
  , FacebookStrategy = require('passport-facebook').Strategy;
var friends = {};

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

passport.use(new FacebookStrategy({
    clientID: 209047922552891,
    clientSecret: "3a07db26df7fee9d9d99b3e01279fdd0",
    callbackURL: "http://localhost:3000/auth/facebook/callback"
  },
  function(accessToken, refreshToken, profile, done) {
		
	facebook.getFbData(accessToken, '/me/friends', function(data){
    		console.log(data);
		friends = data;
	})
	done(null, profile);
    }) 
);

var app = express();

// configure Express
app.configure(function() {
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.logger());
  app.use(express.cookieParser());
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.session({ secret: 'keyboard cat' }));
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.get('/', function(req, res){
  res.render('index', { user: req.user });
});

app.get('/account', ensureAuthenticated, function(req, res){
  res.render('account', { user: req.user, friends: friends });

  var user_data = {'userid': req.user.id, 'user': req.user, 'friends': friends};

  mongo.Db.connect(mongoUri, function (err, db) {
    db.collection('users', function(err, collection) {
      collection.insert(user_data,{safe:true},function(err, item) {
          console.log('saved correctly');
      });
    });
  });
});

app.get('/login', function(req, res){
  res.render('login', { user: req.user });
});

app.get('/auth/facebook',
  passport.authenticate('facebook'),
  function(req, res){
  });

app.get('/auth/facebook/callback', 
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/account');
  });

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

app.listen(3000);

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login')
}
