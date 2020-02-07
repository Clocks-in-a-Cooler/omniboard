var node_canvas = require("canvas");
var fs = require("fs");
var log = require("./logging.js");

var canvas = node_canvas.createCanvas(1920, 1080); //hopefully nobody's using a 4K screen
var cxt = canvas.getContext("2d");

//check if a board.png exists, and load it
var img = new node_canvas.Image();
img.onload = function() {
    cxt.drawImage(img, 0, 0);
};
img.onerror = function(error) {
    log("error loading file: " + error.message, "ERROR");
};
img.src = "board.png";

function eraser(data) {
    var eraser_size = get_eraser_size(data.size);
    cxt.clearRect(data.x - eraser_size, data.y - eraser_size,
        eraser_size * 2, eraser_size * 2);
}

//make sure that the client side has this function, too
function get_eraser_size(size) {
    return size * 3.64 + 1.77; //magic math, that's what.
}

function pencil(data) {
    cxt.strokeStyle = cxt.fillStyle = data.colour;
    cxt.lineWidth = data.size;
    
    cxt.beginPath();
    cxt.moveTo(data.start.x, data.start.y);
    cxt.lineTo(data.end.x, data.end.y);
    cxt.closePath();
    cxt.stroke();
    
    cxt.beginPath();
    cxt.moveTo(data.start.x, data.start.y);
    cxt.arc(data.start.x, data.start.y, data.size / 2, 0, Math.PI * 2);
    cxt.moveTo(data.end.x, data.end.y);
    cxt.arc(data.end.x, data.end.y, data.size / 2, 0, Math.PI * 2);
    cxt.closePath();
    cxt.fill();
}

function save_image() { //again, courtesy of Julian Lannigan on Stack Overflow
    var data = canvas.toDataURL().slice(22);
    var image_buffer = new Buffer(data, "base64");
    log("saving image to file...");
    fs.writeFile("board.png", image_buffer, function(error) {
        if (error) {
            log(error.message, "ERROR");
        }
    });
}

module.exports = {
    get_image: function() {
        return canvas.toDataURL();
    },
    
    draw: function(data) {
        switch (data.tool) {
            case "pencil":
                //pencil code
                pencil(data);
                break;
            case "eraser":
                //eraser code
                eraser(data);
                break;
        }
    },
    
    save_image: save_image,
};
