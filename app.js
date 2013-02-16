var express = require('express');
var app = express();
var _ = require('underscore');
var posts = [];

app.configure(function() {
  // specify view engine
  app.set('view engine', 'ejs');
  app.set('views', __dirname + '/views');

  // load middleware
  app.use(express.favicon());

  app.use(express.bodyParser());
  app.use(express.cookieParser('what a lovely day for a walk'));
  app.use(express.session());
  app.use(function(req, res, next){
    var err = req.session.error
      , msg = req.session.success;
    delete req.session.error;
    delete req.session.success;
    res.locals.message = '';
    if (err) res.locals.message = '<p class="msg error">' + err + '</p>';
    if (msg) res.locals.message = '<p class="msg success">' + msg + '</p>';
    next();
  });
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

function restrict() {
  return function (req, res, next) {
    if (req.session.user === 1) {
      next();
    } else {
      res.send(401, 'Login Required');
    }
  }
}

app.get('/', function(req, res) {
  res.render('index');
})

app.post('/api/sessions', function(req, res) {
  // authenticate
  req.session.regenerate(function() {
    if (req.body.username === 'admin' && req.body.password === 'admin') {
      req.session.user = 1;
      res.send(200, {status: 'ok'});
    } else {
      res.send(500, {status: 'access denied '});
    }
  });
});

app.get('/api/posts/new', restrict(), function(req, res) {
  // get all posts
  res.send(200, 'OK');
});

app.get('/api/posts', function(req, res) {
  // get all posts
  res.send(posts);
});

app.post('/api/posts', restrict(), function(req, res) {
  req.body.id = _.uniqueId();
  posts.push(req.body);
  res.send(201, req.body);
});

app.get('/api/posts/:id/edit', restrict(), function(req, res) {
  var post = _(posts).findWhere({id: req.params.id});
  if (post) {
    res.send(post);
  } else {
    res.send(404, new Error('Not Found!'));
  }
});

app.put('/api/posts/:id', restrict(), function(req, res) {
  var post = _(posts).findWhere({id: req.params.id});
  if (post) {
    _.extend(post, req.body);
    res.send(post);
  } else {
    res.send(404, new Error('Not Found!'));
  }
});

app.del('/api/posts/:id', restrict(), function(req, res) {
  posts = _(posts).filter(function(post) {
    return post.id !== req.params.id;
  });
  res.send(200, { status: 'ok'});
});

app.post('/api/logout', restrict(), function(req, res) {
  delete req.session.user
  res.send(200, { status: 'ok'});
});

app.get('/api/ping', function(req, res) {
  if (req.session.user) {
    res.send(200, { status: 'ok'});
  } else {
    res.send(500, { message: 'Not Logged In!'});
  }
  
})

app.get('/app/*', function(req, res) {
  res.render('index');
});

app.listen(3000);