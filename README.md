<<<<<<< HEAD
# Anti-humanity
card game
=======
# Cards Against Humanity Web Game

A simplified web-based implementation of "Cards Against Humanity" using React, Node.js, Express, and Socket.IO.

## Project Structure

- `/server` - Backend Express server with Socket.IO
- `/client` - React frontend application

## Setup Instructions

### Install Dependencies

1. Install server dependencies:
```
npm install
```

2. Install client dependencies:
```
cd client && npm install
```

Or use the shortcut:
```
npm run install:all
```

### Running the Application

#### Development Mode

1. Start the server (runs on port 3001):
```
npm run dev:server
```

2. In a separate terminal, start the client (runs on port 3000):
```
npm run dev:client
```

Or run both simultaneously:
```
npm run dev
```

#### Production Mode

1. Build the client:
```
cd client && npm run build
```

2. Start the server:
```
npm run start:server
```

## Testing the Connection

1. Open your browser and navigate to `http://localhost:3000`
2. You should see a "Connected" status if the WebSocket connection is successful
3. Try sending a message using the chat interface to test the real-time communication

## Features

- Real-time communication using Socket.IO
- Simple chat interface for testing WebSocket connection
- Express server API endpoint at `/api/status` 
>>>>>>> aa31ec1 (Initial commit)
