var express = require("express");
var app = express();
var http = require("http");
var server = http.createServer(app);
var log = require("./logging.js");

var canvas = require("./canvas.js");
var User = require("./user.js");

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
    log("a new connection is coming...");
    var address = socket.handshake.address, id = socket.id;
    var user;

    function user_exists() {
        if (user == null) {
            socket.emit("request info");
            return false;
        } else {
            return true;
        }
    }

    socket.on("login", (data) => {
        log(data.name + " (socket id: "+ id + ") connecting from " + address);
        user = new User(data.name);
        users.push(user);
        if (user != null) {
            socket.broadcast.emit("notification", user.name + " has joined! Welcome!");
        }
        socket.emit("logged in", {
            image: canvas.get_image(),
        });
    });

    socket.on("reply info", (data) => {
        user = new User(data.name);
        socket.emit("logged in", {
            image: canvas.get_image(),
        });
    });

    socket.on("position update", (data) => {
        if (user_exists()) {
            //when an update comes in
            user.x = data.pos.x; user.y = data.pos.y;
            user.tool = data.tool;
            //ping an update back
            socket.emit("server update", get_users(user));
        }
    });

    socket.on("drawing", (data) => {
        //interpret and broadcast the data
        canvas.draw(data);
        socket.broadcast.emit("draw", data);
    });

    socket.on("send message", (data) => {
        if (user_exists()) {
            var message = user.name + ": " + data;
            log(message, "chat");
            socket.broadcast.emit("incoming message", user.name + ": " + data);
        }
    });

    socket.on("disconnect", (data) => {
        if (user != null) {
            user.online = false;
            socket.broadcast.emit("notification", user.name + " has disconnected");
        }
        log("user at " + address + " has disconnected.", "notification");
    });
});

function get_users(user) {
    var users_data = users.filter(u => {
        return u != user;
    }).map(u => {
        return {
            x: u.x, y: u.y,
            tool: u.tool, name: u.name,
        };
    });

    return users_data;
};

function update() {
    users = users.filter(u => {
        return u.online;
    });

    setImmediate(update);
}

setImmediate(update);
setInterval(function() {
    canvas.save_image();
}, 60000);
