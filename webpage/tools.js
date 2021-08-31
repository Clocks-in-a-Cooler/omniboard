const MOUSE_LEFT_BUTTON  = 1;
const MOUSE_RIGHT_BUTTON = 2;

/**
 * @typedef { Object } Pixel
 * @property { number } r
 * @property { number } g
 * @property { number } b
 * @property { number } a
 */

const colours = { 
    "crimson":      { r: 220, g: 20,  b: 60,  a: 255 },
    "orange":       { r: 255, g: 165, b: 0,   a: 255 },
    "yellow":       { r: 255, g: 255, b: 0,   a: 255 },
    "springgreen":  { r: 0,   g: 255, b: 127, a: 255 },
    "forestgreen":  { r: 34,  g: 139, b: 34,  a: 255 },
    "dodgerblue":   { r: 30,  g: 144, b: 255, a: 255 },
    "midnightblue": { r: 25,  g: 25,  b: 112, a: 255 },
    "black":        { r: 0,   g: 0,   b: 0,   a: 255 },
};

// some client-side helper functions

/**
 * gets the end position of the line/rectangle/circle, depending on whether the shift key is pressed.
 * this is a client side helper function and will not run on the server.
 * @param { { x: number, y: number } } starting_position
 * @returns { { x: number, y: number } }
 */
function get_end_position(start_position) {
    if (!keys.shift) {
        return mouse_position;
    }

    var side_length = Math.min(
        Math.abs(start_position.x - mouse_position.x),
        Math.abs(start_position.y - mouse_position.y)
    );

    var end_position = {
        x: start_position.x + (side_length * Math.sign(mouse_position.x - start_position.x)),
        y: start_position.y + (side_length * Math.sign(mouse_position.y - start_position.y))
    };

    return end_position;
}

/**
 * draws a crosshair in the current mouse position, in the current colour, on the canvas context provided.
 * this is a client side helper function and will not run on the server.
 * @param { CanvasRenderingContext2D } context 
 * @param { number } size
 */
function draw_crosshair(context, size = 10) {
    context.save();
    context.strokeStyle = current_colour;
    context.lineWidth   = 2;
    context.translate(mouse_position.x, mouse_position.y);
    context.beginPath();
    context.moveTo(0, 10);
    context.lineTo(0, -10);
    context.moveTo(10, 0);
    context.lineTo(-10, 0);
    context.closePath();
    context.stroke();
    context.restore();
}

var tools = {
    "pencil": {
        last_pos: null,

        /**
         * @param { MouseEvent } event 
         */
        update: function(event) {
            // client only
            if (event.buttons & MOUSE_LEFT_BUTTON) {
                if (this.last_pos != null) {
                    var drawing_data = {
                        name: username,
                        colour: current_colour,
                        tool: "pencil",
                        start: this.last_pos,
                        end: {
                            x: event.pageX,
                            y: event.pageY,
                        },
                        size: current_size,
                    }

                    socket.emit("drawing", drawing_data);

                    this.draw(drawing_data, image_context);
                }
                this.last_pos = {
                    x: event.pageX,
                    y: event.pageY,
                };
            } else {
                this.last_pos = null;
            }
        },

        draw_control: function() {
            // draws on the control layer
            // client only
            control_context.strokeStyle = current_colour;
            control_context.lineWidth   = 2;
            control_context.beginPath();
            control_context.arc(mouse_position.x, mouse_position.y, current_size / 2, 0, Math.PI * 2);
            control_context.closePath();
            control_context.stroke();
        },

        /**
         * 
         * @param { Object } data
         * @param { string } data.colour
         * @param { Object } data.start
         * @param { number } data.start.x
         * @param { number } data.start.y
         * @param { Object } data.end
         * @param { number } data.end.x
         * @param { number } data.end.y 
         * @param { number } data.size
         * @param { CanvasRenderingContext2D } cxt 
         */
        draw: function(data, cxt) {
            // both client and server
            cxt.fillStyle = cxt.strokeStyle = data.colour;
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
        },
    },

    "eraser": {
        last_pos: null,

        /**
         * @param { MouseEvent } event
         */
        update: function(event) {
            if (event.buttons & MOUSE_LEFT_BUTTON) {
                var mouse_pos = {
                    x: event.pageX,
                    y: event.pageY,
                };
                if (this.last_pos != null) {
                    var draw_data = {
                        name: username,
                        tool: "eraser",
                        size: current_size * 4,
                        start: this.last_pos,
                        end: mouse_pos,
                    };

                    socket.emit("drawing", draw_data);

                    this.draw(draw_data, image_context);
                }
                this.last_pos = mouse_pos;
            } else {
                this.last_pos = null;
            }
        },

        draw_control: function() {
            control_context.strokeStyle = "black";
            control_context.lineWidth   = 2;
            control_context.strokeRect(
                mouse_position.x - current_size * 2,
                mouse_position.y - current_size * 2,
                current_size * 4, current_size * 4
            );
        },

        /**
         * 
         * @param { Object } data
         * @param { string } data.colour
         * @param { Object } data.start
         * @param { number } data.start.x
         * @param { number } data.start.y
         * @param { Object } data.end
         * @param { number } data.end.x
         * @param { number } data.end.y 
         * @param { number } data.size
         * @param { CanvasRenderingContext2D } cxt 
         */
        draw: function(data, cxt) {
            // calculate the start and end boxes
            var start_box = this.get_vertices(data.start, data.size);
            var end_box   = this.get_vertices(data.end, data.size);

            // to do this, we need to ignore one vertex of each square
            // the ignore vertex is the one closest to the *other* square
            var ignore_start = start_box.reduce((v1, v2) => {
                // v1 is the old value
                // v2 is the new value
                var v1_dist = Math.hypot(v1.x - data.end.x, v1.y - data.end.y);
                var v2_dist = Math.hypot(v2.x - data.end.x, v2.y - data.end.y);
                if (v1_dist < v2_dist) {
                    return v1;
                }
                return v2;
            }, { x: Infinity, y: Infinity });

            var ignore_end = end_box.reduce((v1, v2) => {
                // v1 is the old value
                // v2 is the new value
                var v1_dist = Math.hypot(v1.x - data.start.x, v1.y - data.start.y);
                var v2_dist = Math.hypot(v2.x - data.start.x, v2.y - data.start.y);
                if (v1_dist < v2_dist) {
                    return v1;
                }
                return v2;
            }, { x: Infinity, y: Infinity });

            // erase!
            cxt.fillStyle = "white";
            cxt.beginPath();
            var current_box  = start_box;
            var drawn_points = 0; // we need to draw six points total
            var index        = 0;

            if (start_box[0] == ignore_start) {
                cxt.moveTo(start_box[1].x, start_box[1].y);
            } else {
                cxt.moveTo(start_box[0].x, start_box[0].y);
            }

            while (drawn_points <= 8) {
                while (index < 0) {
                    index += 4;
                }
                if (current_box[index % 4] == ignore_start) {
                    current_box = end_box;
                    index--;
                    continue;
                } else if (current_box[index % 4] == ignore_end) {
                    current_box = start_box;
                    index--;
                    continue;
                } else {
                    cxt.lineTo(current_box[index % 4].x, current_box[index % 4].y);
                    index++;
                    drawn_points++;
                }
            }
            cxt.closePath();
            cxt.fill();
        },

        /**
         * given a point and a side length, this generates an array of points representing
         * @param {Object} center
         * @param {Number} center.x
         * @param {Number} center.y
         * @param {Number} size
         * @return {Object[]}
         */
        get_vertices: function(center, size) {
            var side_length = size / 2;
            return [
                {
                    x: center.x - side_length,
                    y: center.y - side_length,
                },
                {
                    x: center.x + side_length,
                    y: center.y - side_length,
                },
                {
                    x: center.x + side_length,
                    y: center.y + side_length,
                },
                {
                    x: center.x - side_length,
                    y: center.y + side_length,
                },
            ];
        },
    },

    "fill": {
        mouse_seen: false,
        /**
         * @param { MouseEvent } event 
         */
        update: function(event) {
            if (event.buttons & MOUSE_LEFT_BUTTON) {
                if (!this.mouse_seen) {
                    var data = {
                        name: username,
                        tool: "fill",
                        x: mouse_position.x,
                        y: mouse_position.y,
                        colour: current_colour,
                    };
                    socket.emit("drawing", data);
                    this.draw(data, image_context);
                    this.mouse_seen = true;
                }
            } else {
                this.mouse_seen = false;
            }
        },

        /**
         * 
         * @param { Object } data
         * @param { number } data.x
         * @param { number } data.y
         * @param { string } data.colour
         * @param { CanvasRenderingContext2D } cxt 
         */
        draw: function(data, cxt) {
            /**
             * @type { Pixel }
             */
            var starting_colour = colours[data.colour];
            if (!colour) { 
                console.log(`unknown colour: ${ data.colour }`);
                return;
            }

            var coordinate_stack = [];

            // finish
        },

        draw_control: function() {
            draw_crosshair(control_context);
        },

        /**
         * @param { ImageData } image_data 
         * @param { number } x 
         * @param { number } y
         * @returns { Pixel }
         */
        get_pixel_data: function(image_data, x, y) {
            var starting_index = (x + y * image_data.width) * 4;
            return {
                r: image_data[starting_index],
                g: image_data[starting_index + 1],
                b: image_data[starting_index + 2],
                a: image_data[starting_index + 3]
            };
        },
    },

    "line": {
        /**
         * @type { { x: number, y: number } }
         */
        starting_pos: null,
        /**
         * @type { { x: number, y: number } }
         */
        ending_pos: null,

        /**
         * @param { MouseEvent } event 
         */
        update: function(event) {
            if (event.buttons & MOUSE_LEFT_BUTTON) {
                if (this.starting_pos == null) {
                    this.starting_pos = mouse_position;
                }
                this.ending_pos = get_end_position(this.starting_pos);
            } else {
                if (this.starting_pos != null) {
                    var data = {
                        colour: current_colour,
                        size: current_size,
                        start: this.starting_pos,
                        end: this.ending_pos,
                        tool: "line",
                    };

                    socket.emit("drawing", data);
                    this.draw(data, image_context);

                    this.starting_pos = null;
                    this.ending_pos   = null;
                }
            }
        },
        
        draw_control: function() {
            draw_crosshair(control_context);
            if (this.starting_pos != null) {
                var data = {
                    colour: current_colour,
                    size: current_size,
                    start: this.starting_pos,
                    end: this.ending_pos,
                    tool: "line",
                };

                this.draw(data, control_context);
            }
        },

        /**
         * 
         * @param { Object } data
         * @param { { x: number, y: number } } data.start
         * @param { { x: number, y: number } } data.end
         * @param { string } data.colour
         * @param { number } data.size
         * @param { CanvasRenderingContext2D } cxt 
         */
        draw: function(data, cxt) {
            cxt.strokeStyle = data.colour;
            cxt.lineWidth   = data.size;

            cxt.beginPath();
            cxt.moveTo(data.start.x, data.start.y);
            cxt.lineTo(data.end.x, data.end.y);
            cxt.closePath();
            cxt.stroke();
        },
    },

    "rectangle": {
        /**
         * @type { { x: number, y: number }}
         */
        starting_pos: null,
        /**
         * @type { { x: number, y: number }}
         */
        ending_pos: null, 

        /**
         * @param { MouseEvent } event 
         */
        update: function(event) {
            if (event.buttons & MOUSE_LEFT_BUTTON) {
                if (this.starting_pos == null) {
                    this.starting_pos = mouse_position;
                }
                this.ending_pos = get_end_position(this.starting_pos);
            } else {
                if (this.starting_pos != null) {
                    var data = {
                        colour: current_colour,
                        size: current_size,
                        start: this.starting_pos,
                        end: this.ending_pos,
                        tool: "rectangle",
                    };

                    socket.emit("drawing", data);
                    this.draw(data, image_context);
                    
                    this.starting_pos = null;
                    this.ending_pos   = null;
                }
            }
        },

        draw_control: function() {
            draw_crosshair(control_context);
            if (this.starting_pos != null) {
                var data = {
                    colour: current_colour,
                    size: current_size,
                    start: this.starting_pos,
                    end: this.ending_pos,
                    tool: "rectangle",
                };

                this.draw(data, control_context);
            }
        },

        /**
         * 
         * @param { Object } data
         * @param { { x: number, y: number } } data.start
         * @param { { x: number, y: number } } data.end
         * @param { string } data.colour
         * @param { number } data.size
         * @param { CanvasRenderingContext2D } cxt 
         */
        draw: function(data, cxt) {
            cxt.strokeStyle = data.colour;
            cxt.lineWidth   = data.size;
            var width       = data.end.x - data.start.x;
            var height      = data.end.y - data.start.y;
            cxt.strokeRect(data.start.x, data.start.y, width, height);
        },
    },

    "circle": {
        /**
         * @type { { x: number, y: number }}
         */
        starting_pos: null,
        /**
         * @type { { x: number, y: number }}
         */
        ending_pos: null,

        /**
         * @param { MouseEvent } event 
         */
         update: function(event) {
            if (event.buttons & MOUSE_LEFT_BUTTON) {
                if (this.starting_pos == null) {
                    this.starting_pos = mouse_position;
                }
                this.ending_pos = get_end_position(this.starting_pos);
            } else {
                if (this.starting_pos != null) {
                    var data = {
                        colour: current_colour,
                        size: current_size,
                        start: this.starting_pos,
                        end: this.ending_pos,
                        tool: "circle",
                    };

                    socket.emit("drawing", data);
                    this.draw(data, image_context);
                    
                    this.starting_pos = null;
                    this.ending_pos   = null;
                }
            }
        },

        draw_control: function() {
            draw_crosshair(control_context);
            if (this.starting_pos != null) {
                var data = {
                    colour: current_colour,
                    size: current_size,
                    start: this.starting_pos,
                    end: this.ending_pos,
                    tool: "circle",
                };

                this.draw(data, control_context);
            }
        },

        /**
         * 
         * @param { Object } data
         * @param { { x: number, y: number } } data.start
         * @param { { x: number, y: number } } data.end
         * @param { string } data.colour
         * @param { number } data.size
         * @param { CanvasRenderingContext2D } cxt 
         */
        draw: function(data, cxt) {
            cxt.strokeStyle = data.colour;
            cxt.lineWidth   = data.size;
            var radius_x    = Math.abs(data.end.x - data.start.x) / 2;
            var radius_y    = Math.abs(data.end.y - data.start.y) / 2;
            var center_x    = (data.start.x + data.end.x) / 2;
            var center_y    = (data.start.y + data.end.y) / 2;

            cxt.beginPath();
            cxt.ellipse(center_x, center_y, radius_x, radius_y, 0, 0, Math.PI * 2);
            cxt.closePath();
            cxt.stroke();
        },
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