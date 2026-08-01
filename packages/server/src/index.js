import { createServer } from 'node:http';
import { WebSocketServer } from 'ws';

const PORT = process.env.PORT || 8085;
const clients = new Map();
const serverLogs = [];

function log(msg) {
  const entry = `[${new Date().toISOString()}] ${msg}`;
  console.log(entry);
  serverLogs.push(entry);
  if (serverLogs.length > 100) serverLogs.shift();
}

const server = createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.url === '/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      uptime: process.uptime(),
      activeClients: clients.size,
      clients: Array.from(clients.values()).map(c => ({ id: c.id, name: c.name, x: c.x, y: c.y })),
      recentLogs: serverLogs.slice(-20)
    }, null, 2));
  } else {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('PROUN Multiplayer WebSocket Server is RUNNING. Visit /status for diagnostics.');
  }
});

const wss = new WebSocketServer({ server });

log(`[PROUN Server] Starting on port ${PORT}...`);

wss.on('connection', (ws, req) => {
  const id = Math.random().toString(36).substring(2, 9);
  const clientState = { id, x: 0, y: 0, vx: 0, vy: 0, tanks: [0,0,0,0], name: `Пилот-${id}` };
  clients.set(ws, clientState);

  log(`[Join] Client ${id} connected from ${req.socket.remoteAddress}. Active clients: ${clients.size}`);

  ws.send(JSON.stringify({ type: 'init', id }));

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      if (data.type === 'state' && data.state) {
        const c = clients.get(ws);
        if (c) {
          if (typeof data.state.x === 'number' && !isNaN(data.state.x)) c.x = data.state.x;
          if (typeof data.state.y === 'number' && !isNaN(data.state.y)) c.y = data.state.y;
          if (typeof data.state.vx === 'number' && !isNaN(data.state.vx)) c.vx = data.state.vx;
          if (typeof data.state.vy === 'number' && !isNaN(data.state.vy)) c.vy = data.state.vy;
          if (Array.isArray(data.state.tanks)) c.tanks = data.state.tanks;
          if (data.state.name) c.name = data.state.name;

          const broadcastMsg = JSON.stringify({
            type: 'player_update',
            id: c.id,
            state: c
          });
          for (const [clientWs] of clients) {
            if (clientWs !== ws && clientWs.readyState === 1) {
              clientWs.send(broadcastMsg);
            }
          }
        }
      } else if (data.type === 'controller_join') {
        const c = clients.get(ws);
        if (c) {
          c.isController = true;
          c.room = data.room || 'A8F2';
          log(`[Controller] Mobile Joystick ${c.id} joined Room ${c.room}`);
          const notifyMsg = JSON.stringify({ type: 'controller_status', room: c.room, connected: true, id: c.id });
          for (const [clientWs] of clients) {
            if (clientWs.readyState === 1) clientWs.send(notifyMsg);
          }
        }
      } else if (data.type === 'controller_input') {
        const room = data.room || 'A8F2';
        const broadcastMsg = JSON.stringify({
          type: 'remote_input',
          room,
          vector: data.vector || { x: 0, y: 0 },
          buttons: data.buttons || { A: false, B: false },
          buttonTap: data.buttonTap || null
        });
        for (const [clientWs] of clients) {
          if (clientWs !== ws && clientWs.readyState === 1) {
            clientWs.send(broadcastMsg);
          }
        }
      }
    } catch (e) {
      log(`[Error] WS message parsing error: ${e.message}`);
    }
  });

  ws.on('close', () => {
    const c = clients.get(ws);
    clients.delete(ws);
    log(`[Leave] Client ${c?.id} disconnected. Active clients: ${clients.size}`);
    if (c) {
      const disconnectMsg = JSON.stringify({ type: 'player_leave', id: c.id });
      for (const [clientWs] of clients) {
        if (clientWs.readyState === 1) clientWs.send(disconnectMsg);
      }
    }
  });

  ws.on('error', (err) => {
    log(`[Error] WS client error: ${err.message}`);
  });
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    log(`[PROUN Server] Port ${PORT} is already in use by an active server process. Continuing...`);
  } else {
    log(`[PROUN Server] Server error: ${err.message}`);
  }
});

server.listen(Number(PORT), '0.0.0.0', () => {
  log(`[PROUN Server] Listening on http://0.0.0.0:${PORT} and ws://0.0.0.0:${PORT}`);
});
