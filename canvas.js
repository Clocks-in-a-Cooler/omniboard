var node_canvas = require("canvas");
var fs          = require("fs");
var log         = require("./logging.js");
var tools       = require("./webpage/tools.js");

var canvas  = node_canvas.createCanvas(1920, 1200);
var context = canvas.getContext("2d");

// check if board.png exists, and load it
var board    = new node_canvas.Image();
board.onload = function() {
    context.drawImage(board, 0, 0);
};
board.onerror = function(error) {
    log(`error loading file: ${ error.message }`, "ERROR");
};

board.src = "board.png";

function save_image() {
    // courtesy of Julian Lannigan on Stack Overflow
    var data         = canvas.toDataURL().slice(22);
    var image_buffer = new Buffer(data, "base64");

    log("saving image to file...");

    fs.writeFile("board.png", image_buffer, function(error) {
        if (error) {
            log(error.message, "ERROR");
        }
    });
}

module.exports = {
    save_image: save_image,

    get_image: function() {
        return canvas.toDataURL();
    },
    
    draw: function(data) {
        tools[data.tool].draw(data, context);
    }
}