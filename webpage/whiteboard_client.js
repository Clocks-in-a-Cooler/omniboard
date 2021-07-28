// find a whole bunch of stuff
const chat_div     = document.getElementById("chat");
const controls_div = document.getElementById("controls");

// some controls things

/**
 * @type { HTMLInputElement }
 */
const size_slider = document.getElementById("size_slider");
/**
 * @type { HTMLParagraphElement }
 */
const size_label = document.getElementById("size_label");

var current_colour = "red";
var current_tool   = "pencil";
var current_size   = 5;

/**
 * @param { String } classname
 * @param { Function } func
 */
function create_radio_button_group(classname, callback) {
    var buttons = Array.from(document.getElementsByClassName(classname));

    buttons.forEach(b => {
        b.addEventListener("click", evt => {
            buttons.forEach(u => {
                u.className = classname;
            });
            b.className += " selected";
            callback(b.id);
        });
    });

    buttons[0].click();
}

create_radio_button_group("tool_button", new_tool => {
    current_tool = new_tool;
});

create_radio_button_group("colour_button", new_colour => {
    current_colour = new_colour;
});

/**
 * @type { HTMLCanvasElement }
 */
const image_canvas = document.getElementById("image_layer");
/**
 * @type { HTMLCanvasElement }
 */
const control_canvas = document.getElementById("control_layer");

const image_context   = image_canvas.getContext("2d");
const control_context = control_canvas.getContext("2d");

image_canvas.width  = control_canvas.width  = window.innerWidth;
image_canvas.height = control_canvas.height = window.innerHeight;

var keys = {
    shift: false,
    ctrl: false,
};

var mouse_down = {
    canvas: false,
    chat: false,
    controls: false,
};

var mouse_position = { x: 0, y: 0 };

var current_tool;
var current_size   = 3;
var current_colour = "black";

// event listeners

chat_div.addEventListener("mousedown", event => {
    event.stopPropagation();
    mouse_down.chat = true;
});

chat_div.addEventListener("mouseup", event => {
    event.stopPropagation();
    mouse_down.chat = false;
});

controls_div.addEventListener("mousedown", event => {
    event.stopPropagation();
    mouse_down.controls = true;
});

controls_div.addEventListener("mouseup", event => {
    event.stopPropagation();
    mouse_down.controls = false;
});

addEventListener("mouseup", event => {
    event.stopPropagation();
    mouse_down.chat     = false;
    mouse_down.controls = false;
});

control_canvas.addEventListener("mousedown", event => {
    event.stopPropagation();
    mouse_down.canvas = true;
});

size_slider.addEventListener("mousemove", event => {
    event.stopPropagation(); 
});

size_slider.addEventListener("input", event => {
    size_label.innerHTML = "Size: " + size_slider.value;
    current_size         = size_slider.value;
});

addEventListener("mousemove", event => {
    if (mouse_down.chat) {
        chat_div.style.top  = "" + (chat_div.offsetTop + event.movementY) + "px";
        chat_div.style.left = "" + (chat_div.offsetLeft + event.movementX) + "px";
        return;
    }
    if (mouse_down.controls) {
        controls_div.style.left = "" + (controls_div.offsetLeft + event.movementX) + "px";
        controls_div.style.top  = "" + (controls_div.offsetTop + event.movementY) + "px";
        return;
    }

    // otherwise, draw
    if (current_tool == null) return;
    mouse_position = { x: event.pageX, y: event.pageY };
    tools[current_tool].update(event);
});

addEventListener("resize", () => {
    image_canvas.width  = control_canvas.width  = window.innerWidth;
    image_canvas.height = control_canvas.height = window.innerHeight;
});

// update cycle

function animate() {
    control_context.clearRect(0, 0, window.innerWidth, window.innerHeight);
    tools[current_tool].draw_control();
    requestAnimationFrame(animate);
}

// start the whole thing
requestAnimationFrame(animate);