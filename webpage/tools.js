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
                        tool: current_tool,
                        start: this.last_pos,
                        end: {
                            x: event.pageX,
                            y: event.pageY,
                        },
                        size: current_size,
                    }

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
                
            }
        }
    }
};