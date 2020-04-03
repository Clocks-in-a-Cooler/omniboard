var tools = {
    "pencil": {
        update: function() {
            //browser only, won't be run on the server side
            if (mouse.clicking) {
                if (this.last_pos != null) {
                    //draw!
                    image_cxt.fillStyle = image_cxt.strokeStyle = current_colour;
                    image_cxt.lineWidth = draw_size;
                    image_cxt.beginPath();
                    image_cxt.moveTo(this.last_pos.x, this.last_pos.y);
                    image_cxt.lineTo(mouse.pos.x, mouse.pos.y);
                    image_cxt.closePath();
                    image_cxt.stroke();

                    image_cxt.beginPath();
                    image_cxt.moveTo(this.last_pos.x, this.last_pos.y);
                    image_cxt.arc(this.last_pos.x, this.last_pos.y,
                        draw_size * 0.5, 0, Math.PI * 2);
                    image_cxt.moveTo(mouse.pos.x, mouse.pos.y);
                    image_cxt.arc(mouse.pos.x, mouse.pos.y,
                        draw_size * 0.5, 0, Math.PI * 2);
                    image_cxt.closePath();
                    image_cxt.fill();

                    socket.emit("drawing", {
                        name: name,
                        colour: current_colour,
                        tool: "pencil",
                        start: this.last_pos,
                        end: mouse.pos,
                        size: draw_size,
                    });
                }

                this.last_pos = mouse.pos;
            } else {
                this.last_pos = null;
            }

            draw_others();
            control_cxt.drawImage(orange_pencil, mouse.pos.x, mouse.pos.y - 30);
        },
        
        draw: function(data, cxt) {
            cxt.fillStyle = cxt.strokeStyle = data.colour;
            cxt.lineWidth = data.size;
            cxt.beginPath();
            cxt.moveTo(data.start.x, data.start.y);
            cxt.lineTo(data.end.x, data.end.y);
            cxt.closePath();
            cxt.stroke();

            cxt.beginPath();
            cxt.moveTo(data.start.x, data.start.y);
            cxt.arc(data.start.x, data.start.y, data.size / 2, 0, Math.PI / 2);
            cxt.moveTo(data.end.x, data.end.y);
            cxt.arc(data.end.x, data.end.y, data.size / 2, 0, Math.PI / 2);
            cxt.closePath();
            cxt.fill();
        },
    },

    "eraser": {
        update: function() {
            //browser only, won't run in the server
            var length = this.get_size(draw_size);
            if (mouse.clicking) {
                image_cxt.clearRect(mouse.pos.x - length,
                    mouse.pos.y - length, length * 2, length * 2);
                socket.emit("drawing", {
                    name: name,
                    size: draw_size,
                    tool: "eraser",
                    x: mouse.pos.x, y: mouse.pos.y,
                });
            }

            //draw on screen
            control_cxt.strokeStyle = "black";
            control_cxt.lineWidth = 2;
            control_cxt.strokeRect(mouse.pos.x - length, mouse.pos.y - length,
                length * 2, length * 2);
            draw_others();
        },
        
        draw: function(data, cxt) {
            var size = this.get_size(data.size);
            cxt.clearRect(data.x - size, data.y - size, data.x + size, data.y - size);
        },

        get_size: function(size) {
            return size * 3.64 + 1.77;
        },
    },
    
    "line": {
        draw: function(data, cxt) {
            cxt.strokeStyle = data.colour;
            cxt.lineWidth = data.size;
            
            cxt.beginPath();
            cxt.moveTo(data.start.x, data.start.y);
            cxt.lineTo(data.end.x, data.end.y);
            cxt.closePath();
            cxt.stroke();
        },
    },

    draw: function(data, cxt) {
        tools[data.tool].draw(data, cxt);
    },
};

try {
    if (window) {
        console.log("tools.js is running in browser");
    }
} catch (e) {
    //if you're here, then we're in Node.js
    module.exports = tools;
}