var tools = {
    "pencil": {
        last_pos: null,
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
        starting_pos: null,
        update: function() {
            if (mouse.clicking) {
                if (this.starting_pos != null) {
                    //create a data object to draw on the control layer
                    this.draw({
                        colour: current_colour,
                        size: draw_size,
                        start: this.starting_pos,
                        end: mouse.pos,
                        tool: "line",
                    }, control_cxt);
                } else {
                    this.starting_pos = mouse.pos;
                }
            } else {
                if (this.starting_pos != null) {
                    //the mouse is released
                    
                    //make the data
                    var data = {
                        colour: current_colour,
                        size: draw_size,
                        start: this.starting_pos,
                        end: mouse.pos,
                        tool: "line",
                    };
                    
                    //draw the data
                    this.draw(data, image_cxt);
                    
                    //send the data
                    socket.emit("drawing", data);
                    
                    this.starting_pos = null;
                }
            }
            
            //draw the crosshair
            this.draw_crosshair();
            
            draw_others();
        },
        
        draw: function(data, cxt) {
            cxt.strokeStyle = data.colour;
            cxt.lineWidth = data.size;
            
            cxt.beginPath();
            cxt.moveTo(data.start.x, data.start.y);
            cxt.lineTo(data.end.x, data.end.y);
            cxt.closePath();
            cxt.stroke();
        },
        
        draw_crosshair: function() {
            //browser only, not executed on the server side
            with (control_cxt) { // i'm using this structure
                save();
                strokeStyle = current_colour;
                lineWidth = 2;
                translate(mouse.pos.x, mouse.pos.y);
                beginPath();
                moveTo(0, 10);
                lineTo(0, -10);
                moveTo(-10, 0);
                lineTo(10, 0);
                closePath();
                stroke();
                restore();
            }
        }
    },
    
    "rectangle": {
        starting_pos: null,
        update: function() {
            //browser only, not run on the server side.
            if (mouse.clicking) {
                if (this.starting_pos != null) {
                    var end_pos = this.get_end_pos();
                                        
                    var data = {
                        start: this.starting_pos,
                        end: end_pos,
                        size: draw_size,
                        colour: current_colour,
                    };
                    
                    //draw that to the control layer
                    this.draw(data, control_cxt);
                } else {
                    this.starting_pos = mouse.pos;
                }
            } else {
                if (this.starting_pos != null) {
                    //for realsies this time to the image layer
                    var data = {
                        tool: "rectangle",
                        start: this.starting_pos,
                        end: this.get_end_pos(),
                        size: draw_size,
                        colour: current_colour,
                    };
                    
                    this.draw(data, image_cxt);
                    
                    //send it to the server
                    socket.emit("drawing", data);
                    this.starting_pos = null;
                }
            }
            
            tools.line.draw_crosshair();
            
            draw_others();
        },
        
        draw: function(data, cxt) {
            cxt.strokeStyle = data.colour;
            cxt.lineWidth = data.size;
            var width = data.end.x - data.start.x;
            var height = data.end.y - data.start.y;
            cxt.strokeRect(data.start.x, data.start.y, width, height);
        },
        
        get_end_pos: function() {
            //client-side only, not executed on the server side
            if (!keys.shift) {
                return mouse.pos;
            }
            
            var end_pos = mouse.pos;
            
            var side_length = Math.min(
                Math.abs(this.starting_pos.x - end_pos.x),
                Math.abs(this.starting_pos.y - end_pos.y)
            );
            
            end_pos.x = this.starting_pos.x + (side_length * Math.sign(end_pos.x - this.starting_pos.x));
            end_pos.y = this.starting_pos.y + (side_length * Math.sign(end_pos.y - this.starting_pos.y));
            
            return end_pos;
        },
    },

    draw: function(data, cxt) {
        tools[data.tool].draw(data, cxt);
    },
};

function get_angle(start, end, degrees) {
    var opp = end.y - start.y;
    var hyp = Math.hypot(start.y - end.y, start.x - end.x);
    
    var angle = Math.asin(opp / hyp);
    
    if (start.x < end.x) {
        angle = Math.PI - angle;
    }
    
    if (degrees) {
        angle = angle * 180 / Math.PI;
    }
    
    return angle;
}

try {
    if (window) {
        console.log("tools.js is running in browser");
    }
} catch (e) {
    //if you're here, then we're in Node.js
    module.exports = tools;
}