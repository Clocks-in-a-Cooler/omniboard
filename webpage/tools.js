var tools = {
    "pencil": {
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