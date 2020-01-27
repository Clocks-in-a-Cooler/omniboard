var express = require("express");
var app = express();
var http = require("http");
var server = http.createServer(app);
var log = require("./logging.js");

var port = process.argv[2]; //too lazy!
if (isNaN(port) || port < 1) port = 3000;

server.listen(port, function() {
    log("new server session");
    log("server listening on port " + port + ".", "notification");
});

var io = require("socket.io").listen(server);

//set up express resources
app.use(express.static(__dirname + "/webpage"));

app.get('/', function(req, res) {
    log("incoming connection from: " + (req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress), "notification");
    res.sendFile(__dirname + "/webpage/index.html");
});

var users = [];

io.on("connection", function(socket) {
    var address = socket.handshake.address, id = socket.id;
    var user;
    socket.on("login", (data) => {
        log(data.name + " (socket id: "+ id + ") connecting from " + address);
        user = new User(data.name);
        users.push(user);
    });
    
    socket.on("position update", (data) => {
        //when an update comes in
    });
    
    socket.on("drawing", (data) => {
        //interpret and broadcast the data
    });
    
    socket.on("disconnect", (data) => {
        user.active = false;
    });
});

function update() {
    users = users.filter(u => {
        return u.online;
    });
}
