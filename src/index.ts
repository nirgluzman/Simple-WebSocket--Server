import express, { Request, Response, Application } from 'express';
import { WebSocketServer, WebSocket } from 'ws';

import 'colors';

const port = process.env.PORT || 8000;

const app: Application = express();

const onSocketPreError = (err: Error) => {
  console.error(err);
};

const onSocketPostError = (err: Error) => {
  console.error(err);
};

app.get('/', (req: Request, res: Response) => {
  res.send('Welcome to Express & TypeScript Server');
});

const server = app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`.green);
});

// create a WebSocket server without the need for an underlying HTTP server.
const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (req, socket, head) => {
  socket.on('error', onSocketPreError);

  // perform auth
  if (!!req.headers['BadAuth']) {
    socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
    socket.destroy();
    return;
  }

  wss.handleUpgrade(req, socket, head, (ws) => {
    socket.removeListener('error', onSocketPreError);
    wss.emit('connection', ws, req);
  });
});

wss.on('connection', (ws, req) => {
  ws.on('error', onSocketPostError);
  ws.on('message', (msg, isBinary) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(msg, { binary: isBinary });
      }
    });
  });

  ws.on('close', () => {
    console.log('Connection closed'.red);
  });
});