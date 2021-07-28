// find a whole bunch of stuff

const chat_div     = document.getElementById("chat");
const controls_div = document.getElementById("controls");

// some controls things

/**
 * @type { HTMLInputElement }
 */
const size_slider = document.getElementById("size_slider");

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

var keys = {
    shift: false,
    ctrl: false,
};

var mouse_down = {
    canvas: false,
    chat: false,
    controls: false,
};

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
    document.getElementById("size_label").innerHTML = "Size: " + size_slider.value;
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
});