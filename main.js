const express = require("express");
const app     = express();
const server  = require("http").createServer(app);
const log     = require("./logging.js");

const User = require("./user.js");

var port = process.argv[2];

if (isNaN(port) || port <= 0) port = 3000;

const socket = require("socket.io");
const { Canvas } = require("canvas");
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
 * @param { socket.Socket } socket 
 */
function handle_connection(socket) {
    log("a new connection is coming...");
    var address = socket.handshake.address;
    var user    = null;

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

        });
    });

    socket.on("reply info", data => {

    });
}

io.on("connection", handle_connection);

app.use(express.static(__dirname + "/webpage"));

app.get("/", (req, res) => {
    log("incoming connection from: " + req.ip, "notification");
    res.send("hello, world!");
});

server.listen(port);

log("started a new server session.", "notification");