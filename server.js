const WebSocket = require('ws');
const http = require('http');

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('WebSocket server running');
});

const wss = new WebSocket.Server({ server });

const clients = new Map();
const rooms = new Map();
const roomPlayers = new Map();
const MAX_ROOM_PLAYERS = 10;

wss.on('connection', (ws) => {
    console.log('New client connected');

    let userId = null;
    let roomId = null;

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            console.log('Received message:', data);

            switch (data.type) {
                case 'join_room':
                    handleJoinRoom(ws, data);
                    break;
                case 'player_sync':
                    handlePlayerSync(data);
                    break;
                case 'player_attack':
                    handlePlayerAttack(data);
                    break;
                default:
                    console.log('Unknown message type:', data.type);
            }
        } catch (error) {
            console.error('Error parsing message:', error);
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
        if (userId && roomId) {
            removeClientFromRoom(userId, roomId);
        }
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });

    function handleJoinRoom(currentSocket, data) {
        const payload = data.data || data;
        const nextUserId = data.userId;
        const nextRoomId = payload.roomId || 'default';

        if (!rooms.has(nextRoomId)) {
            rooms.set(nextRoomId, new Set());
        }
        if (!roomPlayers.has(nextRoomId)) {
            roomPlayers.set(nextRoomId, new Map());
        }

        const room = rooms.get(nextRoomId);
        if (!room) {
            return;
        }

        if (room.size >= MAX_ROOM_PLAYERS) {
            currentSocket.send(JSON.stringify({
                type: 'join_error',
                data: {
                    roomId: nextRoomId,
                    reason: 'room_full',
                    maxPlayers: MAX_ROOM_PLAYERS
                }
            }));
            return;
        }

        userId = nextUserId;
        roomId = nextRoomId;
        clients.set(userId, { ws: currentSocket, roomId });
        room.add(userId);

        const playerInfo = {
            userId: payload.playerInfo.userId,
            name: payload.playerInfo.name,
            level: payload.playerInfo.level,
            hp: payload.playerInfo.hp ?? 100,
            position: payload.playerInfo.position || { x: 0, y: 1.7, z: 0 }
        };
        roomPlayers.get(roomId).set(userId, playerInfo);

        broadcastToRoom(roomId, {
            type: 'player_join',
            data: {
                ...playerInfo,
                playerCount: room.size
            }
        });

        const otherPlayers = [];
        room.forEach((id) => {
            if (id !== userId) {
                const currentPlayer = roomPlayers.get(roomId).get(id);
                if (currentPlayer) {
                    otherPlayers.push(currentPlayer);
                }
            }
        });

        currentSocket.send(JSON.stringify({
            type: 'room_info',
            data: {
                roomId,
                players: otherPlayers,
                playerCount: room.size,
                maxPlayers: MAX_ROOM_PLAYERS
            }
        }));

        console.log(`Player ${userId} joined room ${roomId}`);
    }

    function handlePlayerSync(data) {
        if (!userId || !roomId) {
            return;
        }

        const payload = data.data || {};
        const currentPlayer = roomPlayers.get(roomId)?.get(userId);
        if (currentPlayer) {
            currentPlayer.position = payload.position;
            currentPlayer.hp = payload.hp;
            currentPlayer.level = payload.level;
            currentPlayer.name = payload.name || currentPlayer.name;
        }

        broadcastToRoomExcept(roomId, userId, {
            type: 'player_sync',
            data: {
                userId: data.userId,
                position: payload.position,
                hp: payload.hp,
                level: payload.level,
                name: payload.name || currentPlayer?.name
            }
        });
    }

    function handlePlayerAttack(data) {
        if (!userId || !roomId) {
            return;
        }

        const payload = data.data || {};
        const targetClient = clients.get(payload.targetUserId);
        if (!targetClient || targetClient.roomId !== roomId || targetClient.ws.readyState !== WebSocket.OPEN) {
            return;
        }

        const targetPlayer = roomPlayers.get(roomId)?.get(payload.targetUserId);
        if (targetPlayer) {
            targetPlayer.hp = Math.max(0, (targetPlayer.hp ?? 100) - (payload.damage ?? 0));
        }

        targetClient.ws.send(JSON.stringify({
            type: 'player_attack',
            data: {
                targetUserId: payload.targetUserId,
                attackerId: data.userId,
                attackerName: payload.attackerName || '敌方玩家',
                damage: payload.damage ?? 0
            }
        }));
    }

    function removeClientFromRoom(leavingUserId, leavingRoomId) {
        if (rooms.has(leavingRoomId)) {
            const room = rooms.get(leavingRoomId);
            room.delete(leavingUserId);
            roomPlayers.get(leavingRoomId)?.delete(leavingUserId);

            broadcastToRoom(leavingRoomId, {
                type: 'player_leave',
                data: {
                    userId: leavingUserId,
                    playerCount: room.size
                }
            });

            if (room.size === 0) {
                rooms.delete(leavingRoomId);
                roomPlayers.delete(leavingRoomId);
            }
        }

        clients.delete(leavingUserId);
        console.log(`Player ${leavingUserId} left room ${leavingRoomId}`);
    }
});

function broadcastToRoom(roomId, message) {
    if (rooms.has(roomId)) {
        rooms.get(roomId).forEach((userId) => {
            const client = clients.get(userId);
            if (client && client.ws.readyState === WebSocket.OPEN) {
                client.ws.send(JSON.stringify(message));
            }
        });
    }
}

function broadcastToRoomExcept(roomId, excludeUserId, message) {
    if (rooms.has(roomId)) {
        rooms.get(roomId).forEach((userId) => {
            if (userId !== excludeUserId) {
                const client = clients.get(userId);
                if (client && client.ws.readyState === WebSocket.OPEN) {
                    client.ws.send(JSON.stringify(message));
                }
            }
        });
    }
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`WebSocket server available at ws://localhost:${PORT}`);
});
