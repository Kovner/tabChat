//Comment
var express = require("express");
var app = express();

app.set('views', __dirname + '/views');
app.engine('html', require('ejs').renderFile);
app.use(express.static(__dirname + '/public'));

app.get("/", function(req,res) {
	res.render("index.html");
});

var port = Number(process.env.PORT || 8888);
var io = require('socket.io').listen(app.listen(8888));
console.log("Listening on port " + port);

io.sockets.on('connection', function(socket) {
	// socket.emit('serverMessage', 'Welcome to the chat');
	socket.on('name', function(name) {
		socket.name = name;
		socket.broadcast.emit('serverMessage', name + " joined TabChat.");
		socket.emit('serverMessage', "Hello " + name + ". Welcome to TabChat");
	});
	socket.on('clientMessage', function(data) {
		io.sockets.emit('serverMessage', socket.name + ": " + data);
	});
	socket.on('clientMarks', function(data) {
		io.sockets.emit('serverMarks', {user: socket.name, marks: data.marks, sheet: data.sheet});
	});
	socket.on('clientFilter', function(data) {
		io.sockets.emit('serverFilter', {user: socket.name, genres: data.genres});
	});
});