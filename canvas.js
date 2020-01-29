var node_canvas = require("canvas");
var fs = require("fs");
var log = require("./logging.js");

var canvas = node_canvas.createCanvas(1920, 1080); //hopefully nobody's using a 4K screen
var cxt = canvas.getContext("2d");

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
    /*
    var data = canvas.toDataURL();
    
    var matches = data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/),
    response = {};

    if (matches.length !== 3) {
        return new Error('Invalid input string');
    }

    response.type = matches[1];
    response.data = new Buffer(matches[2], 'base64');
    
    var image_buffer = decodeBase64Image(response);
    */
    var image_buffer = canvas.toBuffer();
    log("saving image to file...");
    fs.writeFile("board.png", image_buffer, function(error) {
        log("error saving image.", "ERROR");
    });
}

module.exports = {
    get_image: function() {
        return cxt.createImageData();
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