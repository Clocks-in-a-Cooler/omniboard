const MOUSE_LEFT_BUTTON  = 1;
const MOUSE_RIGHT_BUTTON = 2;

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
    }
};

try {
    if (window) {
        console.log("tools.js is running in browser");
    }
} catch (e) {
    //if you're here, then we're in Node.js
    module.exports = tools;
}