var express = require('express');
var app = express();
var _ = require('underscore');
var marked = require('marked');
var redis = require('redis');
var posts = [];
var client = redis.createClient();

app.configure(function() {
  // specify view engine
  app.set('view engine', 'ejs');
  app.set('views', __dirname + '/views');
  // load middleware
  app.use(express.favicon());
  app.use(express.cookieParser('what a lovely day for a walk'));
  app.use(express.session());
  app.use(express.bodyParser());
  // Bug csrf not working right
  //app.use(express.csrf());
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
  var oneYear = 31557600000;
  app.use(express.static(__dirname + '/public', { maxAge: oneYear }));
  app.use(express.compress());
});

// middleware for restricting api methods
function restrict() {
  return function (req, res, next) {
    if (req.session.user === 1) {
      next();
    } else {
      res.send(401, 'Login Required');
    }
  }
}

// Initialize App
app.get('/', function(req, res) {
  res.render('index', { token: req.session._csrf});
})

// Create User Session
app.post('/api/sessions', function(req, res) {
  // authenticate
  req.session.regenerate(function() {
    client.get('blog:account', function(err, data) {
      var account = JSON.parse(data);
      if (req.body.username === account.username && req.body.password === account.password) {
        req.session.user = 1;
        res.send(200, {status: 'ok'});
      } else {
        res.send(500, {status: 'access denied '});
      }
    })
  });
});

// Get New Post
app.get('/api/posts/new', restrict(), function(req, res) {
  // get all posts
  res.send(200, 'OK');
});

// List Posts
app.get('/api/posts', function(req, res) {
  client.keys("posts:*", function(err, results) {
    var posts = [];
    results = results.reverse();
    var total = results.length;
    _(results).each(function(key) {
      total--;
      client.get(key, function(err, value) {
        posts.push(JSON.parse(value));
        if (total === 0) {
          setTimeout(function() { 
            try {
              res.json(posts); 
            } catch(err) {
              // swallow error
              //console.log(err);
            }
          }, 200);
          //process.nextTick(function() { res.send(posts); });
          //res.send(posts);
        }
      })
    })
  });
});

// Create Post
app.post('/api/posts', restrict(), function(req, res) {
  client.incr("counters:posts", function(err, uniqueId) {
    req.body.id = uniqueId;
    req.body.html = marked(req.body.body);
    req.body.posted = new Date();
    posts.push(req.body);

    client.set("posts:" + req.body.id, JSON.stringify(req.body), redis.print);
    res.send(201, req.body);
  });
});

// View Post
app.get('/api/posts/:id', function(req, res) {
  client.get("posts:" + req.params.id, function(err, post) {
    if (err) { return res.send(404, new Error('Not Found!')); }
    res.send(JSON.parse(post));
  });
});

// Edit Post
app.get('/api/posts/:id/edit', restrict(), function(req, res) {
  client.get("posts:" + req.params.id, function(err, post) {
    if (err) { return res.send(404, new Error('Not Found!')); }
    res.send(JSON.parse(post));
  });
});

// Update Post
app.put('/api/posts/:id', restrict(), function(req, res) {
  client.get("posts:" + req.params.id, function(err, data) {
    if (err) { return res.send(404, new Error('Not Found!')); }
    req.body.html = marked(req.body.body);
    var post = JSON.parse(data);
    _.extend(post, req.body);
    client.set("posts:" + req.params.id, JSON.stringify(post), function(err, result) {
      res.send(post);
    });
  });
});

// Delete Post
app.del('/api/posts/:id', restrict(), function(req, res) {
  client.del("posts:" + req.params.id, function(err, post) {
    if (err) { return res.send(404, new Error('Not Found!')); }
    res.send(200, { status: 'ok'});
  });
});

// Log Out
app.post('/api/logout', restrict(), function(req, res) {
  delete req.session.user
  res.send(200, { status: 'ok'});
});

// Api Call to Validate Session
app.get('/api/ping', function(req, res) {
  if (req.session.user) {
    res.send(200, { status: 'ok'});
  } else {
    res.send(500, { message: 'Not Logged In!'});
  }
  
})

// HTML5 PushState
app.get('/app/*', function(req, res) {
  res.render('index', { token: req.session._csrf});
});

// listen on server
app.listen(8000);