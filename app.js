
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , io = require('socket.io')
  , spawn = require("child_process").spawn;

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

io = require('socket.io').listen(app)

var com = spawn("dstat", ['-c', '-m', '--nocolor']);
com.stdout.on("data", function(data) {
	var txt = new Buffer(data).toString('utf8', 0, data.length);
	io.sockets.emit("dstat", txt);
});
	
// Helpers
app.helpers({
	renderScriptTags: function(all) {
		if (all != undefined) {
			return all.map(function(script) {
				return '<script src="/javascripts/' + script + '"></script>';
			}).join('\n ');
		} else {
			return '';
		}
	}
});
app.dynamicHelpers({
	scripts: function(req, res) {
		return ['jquery-1.7.1.min.js' ];
	}
});

// Routes

app.get('/', routes.index);
app.get('/charts', function(req, res) {
	return res.render('charts', {
		title: 'Charting Data',
		port: app.address().port
	});
});

app.listen(3000);	
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
