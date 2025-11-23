# 💬 Parlana Enterprise

Sistema de chat colaborativo en tiempo real construido con WebSocket.

## 📋 Descripción

Parlana Enterprise es una aplicación web de chat que permite la comunicación instantánea entre múltiples usuarios mediante tecnología WebSocket. Incluye funcionalidades como cambio de nombre de usuario, historial de mensajes, lista de usuarios activos en tiempo real y reconexión automática.

## ✨ Características

- ✅ Chat en tiempo real con WebSocket
- ✅ Soporte para múltiples usuarios simultáneos
- ✅ Cambio dinámico de nombre de usuario
- ✅ Historial de mensajes (últimos 100)
- ✅ Lista de usuarios activos actualizada en tiempo real
- ✅ Indicador de estado de conexión

## 🛠️ Tecnologías

- **Backend**: Node.js, WebSocket (ws)
- **Frontend**: HTML5, CSS3, JavaScript
- **Utilidades**: uuid, nodemon

## 📦 Requisitos Previos

- Node.js >= 18.0.0
- npm >= 9.0.0

Verifica tu instalación:

```bash
node --version
npm --version
```

## 🚀 Instalación y Ejecución

### 1. Clonar el repositorio

```bash
git clone https://github.com/TU_USUARIO/sharkCodeSoft_WebSocket_Parlana.git
cd sharkCodeSoft_WebSocket_Parlana
```

### 2. Instalar dependencias

```bash
cd backend
npm install
```

### 3. Ejecutar el servidor

**Modo desarrollo** (con hot reload):

```bash
npm run dev
```

**Modo producción**:

```bash
npm start
```

Deberías ver:

```
 Servidor de chat ejecutándose en puerto 8080
 WebSocket disponible en ws://localhost:8080
```

### 4. Acceder a la aplicación

Abre tu navegador y navega a:

```
http://localhost:8080
```

## 📁 Estructura del Proyecto

```
sharkCodeSoft_WebSocket_Parlana/
├── backend/
│   ├── server.js          # Servidor WebSocket y HTTP
│   ├── package.json       # Dependencias del backend
│   └── node_modules/      # Módulos instalados
│
└── frontend/
    ├── index.html         # Interfaz de usuario
    ├── app.js             # Lógica del cliente WebSocket
    └── styles.css         # Estilos de la aplicación
```

## 🎮 Uso

1. **Conectarse**: Abre `http://localhost:8080` en tu navegador
2. **Cambiar nombre**: Escribe tu nombre en el campo "Tu perfil" y presiona "Cambiar"
3. **Enviar mensajes**: Escribe en el campo inferior y presiona Enter o el botón "Enviar"
4. **Múltiples usuarios**: Abre varias pestañas para simular múltiples usuarios