# omniboard

> a collaborative virtual whiteboard with a lot of libraries (because I actually don't know how to code)

## Setup

You will need [git](https://git-scm.com/) and [Node.js](https://nodejs.org/en/) installed, as well as access to the command line.

1. Clone or download this repository.

    `git clone https://github.com/clocks-in-a-cooler/omniboard`
    
    And then `cd omniboard`
    
2. Install some dependencies.

    `npm install`
    
3. Run the server.

    `npm start` or `node main.js`
    
4. Connect to the server.

    Open a browser and go to `localhost:3000`.
    
For a production version of Omniboard, use the `release` branch.

## Credits

Omniboard won't be possible without these libraries and their awesome contributors:

* server framework &mdash; [express](https://expressjs.com/)

* WebSocket handler &mdash; [socket.io](https://socket.io/)

* canvas for the server side &mdash; [node-canvas](https://github.com/Automattic/node-canvas)

* sound for the client notifications &mdash; [zzfx](https://zzfx.3d2k.com/)

* database for chat messages &mdash; [lowdb](https://github.com/typicode/lowdb)

* hashing algorithms &mdash; [jshashes](https://github.com/h2non/jshashes)

## License

MIT License. Use this however you want.
