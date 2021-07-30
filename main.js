const express = require("express");
const app     = express();
const server  = require("http").createServer(app);
const log     = require("./logging.js");

const User = require("./user.js");

var port = process.argv[2];

if (isNaN(port) || port <= 0) port = 3000;

const socket = require("socket.io");
const canvas = require("./canvas.js");
const io     = socket(server);

/**
 * @type { User[] }
 */
var users = [];

/**
 * 
 * @param { User } user 
 */
function remove_user(user) {
    users = users.filter(u => {
        u !== user;
    });
}

/**
 * @param { User } user
 * @returns { Object[] }
 */
function get_users(user) {
    return users.filter(u => {
        return u != user;
    }).map(u => {
        return {
            x: u.x,
            y: u.y,
            tool: u.tool
        };
    });
};

/** 
 * @param { socket.Socket } socket 
 */
function handle_connection(socket) {
    log("a new connection is coming...");
    var address = socket.handshake.address;
    /**
     * @type { User }
     */
    var user    = null;

    /**
     * @param { string } name
     */
    function user_exists(name) {
        if (user == null) {
            user = new User(name, socket);
            log(`a new user has been created: ${ name }, ${ user.id }`);
            users.push(user);
        }
    }

    socket.on("login", data => {
        log(`${ data.name } (${ socket.id }) is connecting from ${ address }`);
        user = new User(data.name, socket);
        users.push(user);
        if (user != null) {
            socket.broadcast.emit("notification", `${ user.name } has joined! Welcome!`);
        }
        socket.emit("logged in", {
            image: canvas.get_image(),
        });
    });

    socket.on("reply info", data => {

    });

    socket.on("drawing", data => {
        canvas.draw(data);
        socket.broadcast.emit("draw", data);
    });

    socket.on("position update", data => {
        user_exists(data.name);
        user.x    = data.x;
        user.y    = data.y;
        user.tool = data.tool;

        socket.emit("server update", get_users(user));
    });

    socket.on("send message", data => {
        var message = user.name + ": " + data;
        log(message, "chat");
        socket.broadcast.emit("incoming message", message);
    });

    socket.on("disconnect", data => {
        socket.broadcast.emit("notification", `${ user.name } has left.`);
        remove_user(user);
    });
}

io.on("connection", handle_connection);

app.use(express.static(__dirname + "/webpage"));

app.get("/", (req, res) => {
    log("incoming connection from: " + req.ip, "notification");
    res.sendFile(__dirname + "/webpage/index.html");
});

server.listen(port);

log("started a new server session.", "notification");