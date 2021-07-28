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
    }
}

module.exports = User;