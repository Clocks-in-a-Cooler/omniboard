// find a whole bunch of stuff
const chat_div     = document.getElementById("chat");
const controls_div = document.getElementById("controls");

const socket  = io();
var username  = "";
var logged_in = false;

// the login form
const overlay = document.getElementById("overlay");

/**
 * @type { HTMLFormElement }
 */
const login_form = document.getElementById("login_form");

login_form.addEventListener("submit", event => {
    event.preventDefault();
    username = login_form.elements.username.value.trim();
    username = username.trim() == "" ? "anonymous" : username;

    console.log(`hello, ${ username }!`);

    socket.emit("login", { name: username });
});

socket.on("logged in", data => {
    console.log("logged in!");
    logged_in = true;
    document.body.removeChild(overlay);

    var img    = new Image();
    img.src    = data.image;
    img.onload = function() {
        image_context.drawImage(img, 0, 0);
    }
    requestAnimationFrame(animate);
});

socket.on("server update", data => {

});

socket.on("draw", data => {
    tools[data.tool].draw(data, image_context);
});

// messages stuff
const messages_panel = document.getElementById("messages");
/**
 * @type { HTMLFormElement }
 */
const messages_form  = document.getElementById("send_message");

function add_message(text, type) {
    var message_elt       = document.createElement("div");
    message_elt.className = "message";

    if (type == "my_message" || type == "notification") {
        message_elt.className += " " + type;
    }
    message_elt.innerHTML = text;
    messages_panel.appendChild(message_elt);
    messages_panel.scrollTo(0, messages_panel.scrollHeight);
}

messages_form.addEventListener("submit", event => {
    event.preventDefault();
    var message = messages_form.elements.message.value;
    message     = message.trim();
    if (message != "") {
        socket.emit("send message", message);
        add_message(message, "my_message");
        messages_form.elements.message.value = "";
    }
})

socket.on("notification", data => {
    add_message(data, "notification");
});

socket.on("incoming message", data => {
    add_message(data, "message");
});

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
    if (!logged_in) return;

    mouse_position = { x: event.pageX, y: event.pageY };

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