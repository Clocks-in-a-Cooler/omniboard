var form = document.querySelector("form");
var io = io();

form.addEventListener("submit", function(event) {
    event.preventDefault();
    console.log("name: " + form.username.value);
    io.emit("login", { name: form.username.value });
    //...and we wait for the reply from the server
});

var image_layer = document.getElementById("image_layer");
var image_cxt = image_layer.getContext("2d");
var control_layer = document.getElementById("control_layer");
var control_cxt = control_layer.getContext("2d");

image_layer.width = control_layer.width = window.innerWidth - 400;
image_layer.height = control_layer.height = window.innerHeight;

var chat = document.getElementById("chat");
