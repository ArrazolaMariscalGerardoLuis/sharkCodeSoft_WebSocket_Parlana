const WebSocket = require('ws');
const http = require('http');
const uuid = require('uuid');

class ChatServer {
    constructor() {
        this.server = http.createServer();
        this.wss = new WebSocket.Server({ server: this.server });
        this.clients = new Map();
        this.messageHistory = [];
        this.maxHistory = 100;
    }

    setupWebSocket() {
        this.wss.on('connection', (ws) => {
            const user = {
                id: uuid.v4(),
                username: `Usuario${Math.floor(Math.random() * 1000)}`,
                ws: ws
            };

            this.clients.set(ws, user);
            console.log(`✅ Usuario conectado: ${user.username}`);

            // Enviar información del usuario
            this.sendToClient(ws, {
                type: 'user_info',
                user: user
            });

            // Enviar historial de mensajes
            this.sendToClient(ws, {
                type: 'message_history',
                data: this.messageHistory
            });

            // Notificar a todos que un usuario se unió
            this.broadcastToAll({
                type: 'user_joined',
                user: { id: user.id, username: user.username },
                message: `${user.username} se ha unido al chat`,
                activeUsers: this.getActiveUsers()
            });

            ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data);
                    this.handleMessage(ws, message);
                } catch (error) {
                    console.error('Error parsing message:', error);
                }
            });

            ws.on('close', () => {
                this.handleDisconnection(ws);
            });

            ws.on('error', (error) => {
                console.error('WebSocket error:', error);
                this.handleDisconnection(ws);
            });
        });
    }

    handleMessage(ws, message) {
        const user = this.clients.get(ws);

        switch (message.type) {
            case 'chat_message':
                const chatMessage = {
                    type: 'chat_message',
                    id: uuid.v4(),
                    user: { id: user.id, username: user.username },
                    content: message.content,
                    timestamp: new Date().toISOString(),
                    room: message.room || 'general'
                };

                this.messageHistory.push(chatMessage);
                if (this.messageHistory.length > this.maxHistory) {
                    this.messageHistory.shift();
                }

                this.broadcastToAll(chatMessage);
                break;

            case 'change_username':
                const oldUsername = user.username;
                const newUsername = message.newUsername.substring(0, 20);

                if (newUsername && newUsername !== oldUsername) {
                    console.log(`🔄 ${oldUsername} cambió a ${newUsername}`);
                    
                    user.username = newUsername;

                    const changeMessage = {
                        type: 'username_changed',
                        user: { id: user.id, username: user.username },
                        message: `${oldUsername} ahora es ${newUsername}`,
                        activeUsers: this.getActiveUsers() // ✅ Siempre enviar activeUsers
                    };

                    this.broadcastToAll(changeMessage);

                    this.messageHistory.push({
                        ...changeMessage,
                        timestamp: new Date().toISOString()
                    });
                }
                break;

            case 'typing':
                this.broadcast({
                    type: 'user_typing',
                    user: { id: user.id, username: user.username },
                    isTyping: message.isTyping
                }, ws);
                break;
        }
    }

    handleDisconnection(ws) {
        const user = this.clients.get(ws);
        if (user) {
            this.clients.delete(ws);
            console.log(`❌ Usuario desconectado: ${user.username}`);

            this.broadcastToAll({
                type: 'user_left',
                user: { id: user.id, username: user.username },
                message: `${user.username} ha abandonado el chat`,
                activeUsers: this.getActiveUsers()
            });

            this.messageHistory.push({
                type: 'user_left',
                user: { id: user.id, username: user.username },
                message: `${user.username} ha abandonado el chat`,
                timestamp: new Date().toISOString()
            });
        }
    }

    sendToClient(ws, message) {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(message));
        }
    }

    broadcastToAll(message) {
        const messageStr = JSON.stringify(message);
        
        this.clients.forEach((user, ws) => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(messageStr);
            }
        });
    }

    getActiveUsers() {
        return Array.from(this.clients.values()).map(user => ({
            id: user.id,
            username: user.username
        }));
    }

    start(port = 8080) {
        this.server.listen(port, () => {
            console.log(`🚀 Servidor de chat ejecutándose en puerto ${port}`);
            console.log(`🔗 WebSocket disponible en ws://localhost:${port}`);
        });
    }
}

// Iniciar servidor
const chatServer = new ChatServer();
chatServer.start(8080);