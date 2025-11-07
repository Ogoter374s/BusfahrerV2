# Busfahrer V2

Busfahrer V2 is an online version of the Austrian drinking card game "Busfahrer" (Bus Driver).
This project consists of a **React.js frontend** and a **Node.js Express backend**, allowing players to enjoy the game digitally with friends.

## Features
- Multiplayer support
- Interactive UI built with React.js
- Fast and scalable backend using Node.js & Express
- WebSocket support for real-time gameplay
- Custom game rules and variations
- Achievement System
- Friend System
- Game and Friends Chat
- User Statistics

## Tech Stack
### Frontend:
- React.js
- REST (for API requests)
- Vite
- WebSockets (for real-time communication)
- Tailwindcss (framework)
- JsDoc

### Backend:
- Node.js
- Express.js
- WebSockets (Socket.io)
- TLS Support
- MongoDb
- openssl (or any other tool to create SSL Certificates)

## Installation
### Prerequisites
- Node.js (>= 16.x)
- npm or yarn
- MongoDb

## Setup

### Clone Repository
```sh
git clone https://github.com/Ogoter374s/BusfahrerV2
cd BusfahrerV2
npm install
```

### SSL Certificate Setup

This project uses HTTPS for local development.  
You need to create a self-signed SSL certificate and place it in the `cert` folder.

#### Create the `cert` directory
```bash
mkdir cert
openssl req -x509 -newkey rsa:4096 -sha256 -days 365 -nodes \
  -keyout cert/localhost-key.pem \
  -out cert/localhost.pem \
  -subj "/CN=localhost"
```

### Backend Setup
You need to navigate to the server directory and install all the packages.

```sh
cd server
npm install
``` 

Before you can start the server you need to create a .env file.
You also need to have created the certification files.
Here is a example how such a file has to look like.
Replace the value of the variables if needed.

```javascript
// MongoDB connection string
// Replace "user", "password", and "IP" with your own
MONGO_URI=mongodb://user:password@127.0.0.1/BusfahrerV2

// JWT secret key for authentication
// Use a long, random string in production
JWT_SECRET=your_jwt_secret_here

// Base URL of the backend server
BASE_URL=https://localhost:3001/

// WebSocket server URL
WBS_URL=wss://localhost:8080

// Frontend URL
FRONT_URL=https://localhost:5173

// Ports for backend and WebSocket server
BASE_PORT=3001
WBS_PORT=8080

// MongoDB database name
DATABASE=BusfahrerV2

// SSL certificate files
SSL_KEY=../../cert/localhost-key.pem
SSL_CERT=../../cert/localhost.pem

// Chaos mode factor (used in the game logic)
CHAOS_MODE=0.2

// TLS session ticket keys file
TLS_TICKET_KEYS_FILE=./ticket-keys.bin
```

Now you can start the server

```sh
node .\server.js
```

### Frontend Setup
You need to navigate to the client directory and install all packages.

```sh
cd client
npm install
```

Before you can start the client you need to create a .env file.
Here is a example how such a file has to look like.
Replace the value of the variables if needed.

```javascript
// Backend base URL
// This should match the BASE_URL from your backend .env
VITE_BASE_URL=https://localhost:3001/

// WebSocket URL
// This should match the WBS_URL from your backend .env
VITE_WBS_URL=wss://localhost:8080

// SSL certificate paths HTTPS
VITE_SSL_KEY=../../cert/localhost-key.pem
VITE_SSL_CERT=../../cert/localhost.pem

// Host URL for the Vite dev server
VITE_HOST=https://localhost

// Port for the Vite dev server
VITE_PORT=5173
```

Now you can start the client

```sh
npm run dev
```

After the start press:
h + enter to show help

### Tailwindcss

If you want to change the Visualization or add someting new, you need to start the tailwind process.

```sh
cd client
```

After navigating into the client folder you just have to start the tailwind watch.

```sh
npx tailwindcss -i ./src/index.css -o ./src/main.css --watch
```

Now the css should update automatically after every time you save the project.

### JsDoc

For the Documentation JsDoc is used.
With the Command:

```sh
npx jsdoc ./ -r -d docs
```

you create the documentation for all of the client and server files.
If you create a new file it should always look like this:

At the top of the file you need to have a **@fileoverview** with a simple description of the file

```javascript
/**
 * @fileoverview Custom file.
 * 
 * This file is used to create/manage/display various things. 
 */
```

Before a function you need to have a simple description of the usage of the function.
With **<strong>const<strong>** you show the inner functions/consts of the function itself.
After that the **@function** with the parameters and return value.
At the end of each sentence a <br> shoud be for a space inbetween <br><br>

```javascript
/**
 * Custom file to create/manage/display various things.
 * <br><br>
 * This file integrates various types and provides functions to handle actions.
 * <br><br>
 * <strong>function:</strong> <br>
 * This function does something.
 * <br><br>
 * 
 * @function exampole
 * @param {string} variable - A Variable of the function (optional)
 * @returns {object} The return object/value of the function
 */
```

In the function object the inner functions/consts should also have a simple description.
Here you don't need to have <br>, because you wont see this in the docs.
This Comments are only for the developer for easier understanding.

```javascript
/**
  * Description of the specific under function/const.
  */ 
```

## Running the Game
1. Start the backend server: `node .\server.js` in the `server` directory.
2. Start the frontend: `npm run dev` in the `client` directory.
3. Open your browser and navigate to `http://localhost:1571`.
4. Enjoy the game!

## Contributing
Contributions are welcome! Feel free to open issues or submit pull requests.

## License
This project is licensed under the MIT License.

## Contact
For questions or suggestions, feel free to reach out via email or create an issue on GitHub.

## Contributors
<a href="https://github.com/Ogoter374s/BusfahrerV2/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=Ogoter374s/BusfahrerV2" />
</a>
