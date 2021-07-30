const socket = require("socket.io");

class User {
    /**
     * 
     * @param { string } name 
     * @param { socket.Socket } socket 
     */
    constructor(name, socket) {
        this.name = name;
        this.id   = socket.id;
        this.x    = 0;
        this.y    = 0;
        this.tool = "pencil";
    }
}

module.exports = User;