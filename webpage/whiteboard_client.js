var form = document.getElementById("login_form");
var socket = io();

form.addEventListener("submit", function(event) {
    event.preventDefault();
    console.log("name: " + form.username.value);
    socket.emit("login", { name: form.username.value });
    //...and we wait for the reply from the server
});

//set up the sprites
function create_sprite(path) {
    var spr = document.createElement("img");
    spr.src = path;
    return spr;
}
var orange_pencil = create_sprite("pencil_orange.png");
var blue_pencil = create_sprite("pencil_blue.png");
var eraser = create_sprite("eraser.png");

//set up the rest of the page.
var image_layer = document.getElementById("image_layer");
var image_cxt = image_layer.getContext("2d");
var control_layer = document.getElementById("control_layer");
var control_cxt = control_layer.getContext("2d");

image_layer.width = control_layer.width = window.innerWidth - 400;
image_layer.height = control_layer.height = window.innerHeight;

var chat = document.getElementById("chat");
var controls = document.getElementById("controls");

function create_rbutton_group(element, callback) {
    var buttons = element.childNodes;
    //nesting! fun! i code terrible!
    buttons.forEach((b) => {
        b.addEventListener("click", (evt) => {
            buttons.forEach((u) => {
                u.className = "rbutton";
            });
            
            b.className += " selected";
            callback(b.id);
        });
    });
}

var draw_size = 1;

var mouse = {
    clicking: false,
    pos: {x: null, y: null},
    click: function() {
        console.log("mouse click at (" + mouse.pos.x + ", " + mouse.pos.y + ")");
    },
    scroll: function(evt) {
        var direction = mouse.find_scroll_direction(evt);
        if (direction == "down") {
            draw_size -= 0.1;
            draw_size = Math.max(draw_size, 0.2);
        } else {
            draw_size += 0.1;
            draw_size = Math.min(draw_size, 5);
        }
    },
    // courtesy of Stack Overflow
    find_scroll_direction: function(e) {
        var delta;

        if (e.wheelDelta){
            delta = e.wheelDelta;
        } else {
            delta = -1 * e.deltaY;
        }

        if (delta < 0){
            return "down";
        } else if (delta > 0){
            return "up";
        }
    },
};

function addEventListeners() {
    addEventListener("mousedown", function() {
        mouse.clicking = true;
    });

    addEventListener("mouseup", function() {
        mouse.clicking = false;
    });

    addEventListener("mousemove", function(evt) {
        mouse.pos = { x: evt.clientX, y: evt.clientY };
    });

    addEventListener("click", mouse.click);

    addEventListener("wheel", mouse.scroll);
    
    addEventListener("keyup", function(evt) {
        switch (evt.key) {
            case "S":
            case "s":
                if (evt.ctrlKey) {
                    save_image();
                }
                break;
            case " ":
                toggle_controls();
                break;
        }
    });
}

var others = [];

function draw_others() {
    control_cxt.fillStyle = "dodgerblue";
    control_cxt.font = "12pt sans-serif";
    control_cxt.textBaseline = "top";
    control_cxt.textAlign = "center";
    others.forEach(u => {
        switch (u.tool) {
            case "pencil":
                control_cxt.drawImage(blue_pencil, u.x, u.y - 30);
                break;
            case "eraser":
                control_cxt.drawImage(eraser, u.x, u.y - 30);
                break;
        }
        control_cxt.fillText(u.name, u.x, u.y + 3);
    });
}

var tools = {
    /*
        data to send:
        [ ] size of pencil/eraser
        [ ] position of the mouse (start and end for pencil, x and y for eraser)
        [ ] current tool (so that the data can be interpreted properly
        [ ] colour
    */
    "pencil": {
        last_pos: null,
        update: function() {
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
        
        draw: function(data) {
            image_cxt.strokeStyle = image_cxt.fillStyle = data.colour;
            image_cxt.lineWidth = data.size;
            
            image_cxt.beginPath();
            image_cxt.moveTo(data.start.x, data.start.y);
            image_cxt.lineTo(data.end.x, data.end.y);
            image_cxt.closePath();
            image_cxt.stroke();
            
            image_cxt.beginPath();
            image_cxt.moveTo(data.start.x, data.start.y);
            image_cxt.arc(data.start.x, data.start.y, data.size / 2, 0, Math.PI * 2);
            image_cxt.moveTo(data.end.x, data.end.y);
            image_cxt.arc(data.end.x, data.end.y, data.size / 2, 0, Math.PI * 2);
            image_cxt.closePath();
            image_cxt.fill();
        },
    },
    
    "eraser": {
        update: function() {
            var length = this.get_size(draw_size);
            if (mouse.clicking) {
                image_cxt.clearRect(mouse.pos.x - length,
                    mouse.pos.y - length, length * 2, length * 2);
                socket.emit("drawing", {
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
        
        get_size: function(size) {
            return size * 3.64 + 1.77;
        },
        
        draw: function(data) {
            var eraser_size = this.get_size(data.size);
            image_cxt.clearRect(data.x - eraser_size, data.y - eraser_size,
                eraser_size * 2, eraser_size * 2);
        },
    },
};

var current_colour = "dodgerblue";
var current_tool = "pencil";

create_rbutton_group(document.getElementById("colour_controls"), (data) => {
    current_colour = data;
});

create_rbutton_group(document.getElementById("tools"), (data) => {
    current_tool = data;
});

function save_image() {
    var link = document.createElement('a');
    link.download = 'omniboard.png';
    link.href = image_layer.toDataURL();
    link.click();
}

function toggle_controls() {
    var visibility = controls.style.visibility;
    controls.style.visibility = visibility == "hidden" ? "visible" : "hidden";
}

//events from the server
socket.on("logged in", (data) => {
    document.body.removeChild(document.getElementById("mask"));
    document.body.removeChild(document.getElementById("login_box"));
    
    var img = new Image();
    img.src = data.image;
    img.onload = function() { image_cxt.drawImage(img, 0, 0); };
    //image_cxt.putImageData(data.image, 0, 0);
    addEventListeners();
    requestAnimationFrame(cycle);
});

socket.on("server update", (data) => {
    others = data;
    /*data.forEach(u => {
        control_cxt.drawImage(blue_pencil, u.x, u.y - 30);
    });*/
});

socket.on("draw", (data) => {
    //the same as tcanvas.js on the server side!
    switch (data.tool) {
        case "pencil":
            tools.pencil.draw(data);
            break;
        case "eraser":
            tools.eraser.draw(data);
            break;
    }
});

function cycle() {
    control_cxt.clearRect(0, 0, control_layer.width, control_layer.height);
    tools[current_tool].update();
    socket.emit("position update", { pos: mouse.pos, tool: current_tool, });
    requestAnimationFrame(cycle);
}
