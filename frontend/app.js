class Parlana {
    constructor() {
        this.socket = null;
        this.user = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.typingTimeout = null;
        this.isTyping = false;
        this.currentUserList = []; // ✅ GUARDAR lista actual de usuarios

        this.initializeElements();
        this.connect();
    }

    initializeElements() {
        this.statusDot = document.getElementById('statusDot');
        this.statusText = document.getElementById('statusText');
        this.usernameInput = document.getElementById('usernameInput');
        this.changeNameBtn = document.getElementById('changeNameBtn');
        this.userId = document.getElementById('userId');
        this.userCount = document.getElementById('userCount');
        this.userList = document.getElementById('userList');
        this.messagesContainer = document.getElementById('messagesContainer');
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        this.typingIndicator = document.getElementById('typingIndicator');

        this.setupEventListeners();
    }

    setupEventListeners() {
        this.changeNameBtn.addEventListener('click', () => {
            this.changeUsername(this.usernameInput.value);
        });

        this.usernameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.changeUsername(this.usernameInput.value);
            }
        });

        this.messageInput.addEventListener('input', (e) => {
            this.handleTyping(true);
            this.autoResizeTextarea(e.target);
        });

        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        this.sendButton.addEventListener('click', () => {
            this.sendMessage();
        });

        this.messageInput.addEventListener('blur', () => {
            this.handleTyping(false);
        });
    }

    autoResizeTextarea(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }

    connect() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//localhost:8080`;
        
        try {
            this.socket = new WebSocket(wsUrl);
            this.setupWebSocketHandlers();
        } catch (error) {
            console.error('Error creando WebSocket:', error);
            this.handleConnectionError();
        }
    }

    setupWebSocketHandlers() {
        this.socket.onopen = () => {
            console.log('Conexión WebSocket establecida');
            this.handleConnectionSuccess();
        };

        this.socket.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                this.handleMessage(message);
            } catch (error) {
                console.error('Error procesando mensaje:', error);
            }
        };

        this.socket.onclose = (event) => {
            console.log('Conexión WebSocket cerrada:', event);
            this.handleDisconnection();
        };

        this.socket.onerror = (error) => {
            console.error('Error WebSocket:', error);
            this.handleConnectionError();
        };
    }

    handleConnectionSuccess() {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.updateConnectionStatus('Conectado', true);
        this.messageInput.disabled = false;
        this.sendButton.disabled = false;
        
        this.addSystemMessage('Conectado al chat');
    }

    handleDisconnection() {
        this.isConnected = false;
        this.updateConnectionStatus('Desconectado', false);
        this.messageInput.disabled = true;
        this.sendButton.disabled = true;
        
        this.addSystemMessage('Desconectado del chat. Intentando reconectar...');
        this.attemptReconnection();
    }

    handleConnectionError() {
        this.updateConnectionStatus('Error de conexión', false);
        this.addSystemMessage('Error de conexión. Verifica que el servidor esté ejecutándose.');
    }

    attemptReconnection() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = Math.min(1000 * this.reconnectAttempts, 10000);
            
            setTimeout(() => {
                this.connect();
            }, delay);
        } else {
            this.addSystemMessage('No se pudo reconectar. Por favor, recarga la página.');
        }
    }

    updateConnectionStatus(status, isConnected) {
        this.statusText.textContent = status;
        this.statusDot.className = `status-dot ${isConnected ? 'connected' : ''}`;
    }

    handleMessage(message) {
        console.log('🔍 Mensaje recibido:', message.type, 'activeUsers:', message.activeUsers);

        switch (message.type) {
            case 'user_info':
                this.user = message.user;
                this.updateUserInfo();
                break;
                
            case 'message_history':
                this.loadMessageHistory(message.data);
                break;
                
            case 'chat_message':
                this.addChatMessage(message);
                break;
                
            case 'user_joined':
                this.addSystemMessage(message.message, 'join');
                this.updateUserList(message.activeUsers);
                break;
                
            case 'user_left':
                this.addSystemMessage(message.message, 'leave');
                this.updateUserList(message.activeUsers);
                break;
                
            case 'username_changed':
                console.log('🔄 Procesando cambio de nombre, activeUsers:', message.activeUsers);
                this.addSystemMessage(message.message);
                
                // ✅ ACTUALIZAR SOLO EL USUARIO QUE CAMBIÓ, NO BORRAR TODA LA LISTA
                this.updateSingleUser(message.user);
                
                if (this.user && message.user && message.user.id === this.user.id) {
                    this.user.username = message.user.username;
                    this.updateUserInfo();
                }
                break;
                
            case 'user_typing':
                this.showTypingIndicator(message.user, message.isTyping);
                break;
                
            case 'error':
                console.error('Error del servidor:', message.message);
                this.addSystemMessage(`Error: ${message.message}`, 'error');
                break;
        }
    }

    updateUserInfo() {
        if (this.user) {
            this.usernameInput.value = this.user.username;
            this.userId.textContent = `ID: ${this.user.id}`;
        }
    }

    loadMessageHistory(messages) {
        const welcomeMessage = this.messagesContainer.firstElementChild;
        this.messagesContainer.innerHTML = '';
        if (welcomeMessage) {
            this.messagesContainer.appendChild(welcomeMessage);
        }
        
        messages.forEach(message => {
            switch (message.type) {
                case 'chat_message':
                    this.addChatMessage(message, false);
                    break;
                case 'user_joined':
                case 'user_left':
                case 'username_changed':
                    this.addSystemMessage(message.message, 
                        message.type === 'user_joined' ? 'join' : 
                        message.type === 'user_left' ? 'leave' : 'default');
                    break;
            }
        });
        
        this.scrollToBottom();
    }

    addChatMessage(message, animate = true) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${animate ? 'animate' : ''}`;
        
        const isOwnMessage = this.user && message.user.id === this.user.id;
        
        const bubble = document.createElement('div');
        bubble.className = `message-bubble ${isOwnMessage ? 'own' : ''}`;
        
        bubble.innerHTML = `
            <strong>${this.escapeHtml(message.user.username)}</strong>
            <span>${this.escapeHtml(message.content)}</span>
            <small>${new Date(message.timestamp).toLocaleTimeString()}</small>
        `;
        
        messageDiv.appendChild(bubble);
        this.messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }

    addSystemMessage(text, type = 'default') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `system-message ${type}`;
        messageDiv.textContent = text;
        this.messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }

    updateUserList(users) {
        console.log('🔄 Actualizando lista de usuarios:', users);
        
        // ✅ SOLUCIÓN: Si users es undefined, NO hacer nada
        if (!users || !Array.isArray(users)) {
            console.warn('⚠️ Lista de usuarios inválida, manteniendo lista actual');
            return; // ¡NO borrar la lista!
        }
        
        // ✅ Guardar la lista actual
        this.currentUserList = users;
        
        this.userCount.textContent = users.length;
        this.userList.innerHTML = '';
        
        users.forEach(user => {
            if (!user || !user.id || !user.username) {
                console.warn('⚠️ Usuario inválido:', user);
                return;
            }
            
            const userItem = document.createElement('li');
            userItem.className = 'user-item';
            
            const isCurrentUser = this.user && user.id === this.user.id;
            if (isCurrentUser) {
                userItem.style.background = '#e3f2fd';
                userItem.style.border = '1px solid #3498db';
            }
            
            userItem.innerHTML = `
                <div class="user-avatar" style="background: ${isCurrentUser ? '#3498db' : '#2ecc71'}"></div>
                <span>${this.escapeHtml(user.username)} ${isCurrentUser ? '(Tú)' : ''}</span>
            `;
            this.userList.appendChild(userItem);
        });
        
        console.log('✅ Lista de usuarios actualizada');
    }

    // ✅ NUEVO MÉTODO: Actualizar solo un usuario específico
    updateSingleUser(updatedUser) {
        if (!updatedUser || !updatedUser.id || !updatedUser.username) {
            console.warn('⚠️ Usuario a actualizar inválido:', updatedUser);
            return;
        }
        
        console.log('🔄 Actualizando usuario:', updatedUser.username);
        
        // Buscar el usuario en la lista actual y actualizarlo
        let userFound = false;
        const userItems = this.userList.getElementsByClassName('user-item');
        
        for (let i = 0; i < userItems.length; i++) {
            const userItem = userItems[i];
            const usernameSpan = userItem.querySelector('span');
            const currentUsername = usernameSpan.textContent.replace(' (Tú)', '').trim();
            
            // Buscar por ID si es posible, sino por nombre
            if (this.currentUserList[i] && this.currentUserList[i].id === updatedUser.id) {
                // Actualizar el nombre en la lista actual
                this.currentUserList[i].username = updatedUser.username;
                
                // Actualizar en la UI
                const isCurrentUser = this.user && updatedUser.id === this.user.id;
                usernameSpan.innerHTML = `${this.escapeHtml(updatedUser.username)} ${isCurrentUser ? '(Tú)' : ''}`;
                userFound = true;
                break;
            }
        }
        
        // Si no encontró el usuario, actualizar toda la lista (fallback)
        if (!userFound) {
            console.log('⚠️ Usuario no encontrado en lista, solicitando lista completa...');
            // En una implementación completa, aquí pedirías la lista al servidor
        }
        
        console.log('✅ Usuario actualizado en la lista');
    }

    showTypingIndicator(user, isTyping) {
        if (isTyping) {
            console.log(`${user.username} está escribiendo...`);
        }
    }

    handleTyping(isTyping) {
        if (this.isTyping !== isTyping && this.isConnected) {
            this.isTyping = isTyping;
            this.send({
                type: 'typing',
                isTyping: isTyping
            });
        }

        if (this.typingTimeout) {
            clearTimeout(this.typingTimeout);
        }

        if (isTyping) {
            this.typingTimeout = setTimeout(() => {
                this.handleTyping(false);
            }, 1000);
        }
    }

    changeUsername(newUsername) {
        if (newUsername && newUsername.trim() && this.isConnected) {
            console.log('📤 Solicitando cambio de nombre a:', newUsername);
            this.send({
                type: 'change_username',
                newUsername: newUsername.trim()
            });
        }
    }

    sendMessage() {
        const content = this.messageInput.value.trim();
        if (content && this.isConnected) {
            this.send({
                type: 'chat_message',
                content: content,
                room: 'general'
            });
            
            this.messageInput.value = '';
            this.autoResizeTextarea(this.messageInput);
            this.handleTyping(false);
        }
    }

    send(message) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(message));
            return true;
        }
        return false;
    }

    scrollToBottom() {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.chatApp = new Parlana();
});