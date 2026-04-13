import { ClientEvent } from './clientEvent';
import { Constant } from './constant';
import { PlayerData } from './playerData';

export class NetworkManager {
    private static _instance: NetworkManager;
    private _socket: WebSocket | null = null;
    private _reconnectTimer: number = -1;
    private _reconnectAttempts: number = 0;
    private _maxReconnectAttempts: number = 5;
    private _reconnectDelay: number = 3000;
    private _messageQueue: any[] = [];
    private _isConnected: boolean = false;
    private _serverUrl: string = 'ws://localhost:3000'; // 服务器地址
    private _lastSyncTime: number = 0;
    private _syncInterval: number = 100; // 同步间隔，单位毫秒
    private _messageCache: any = {}; // 消息缓存，用于去重

    public static get instance() {
        if (!this._instance) {
            this._instance = new NetworkManager();
        }
        return this._instance;
    }

    /**
     * 连接到服务器
     */
    public connect() {
        if (this._socket && (this._socket.readyState === WebSocket.OPEN || this._socket.readyState === WebSocket.CONNECTING)) {
            return;
        }

        try {
            this._socket = new WebSocket(this._serverUrl);
            
            this._socket.onopen = () => {
                console.log('WebSocket connected');
                this._isConnected = true;
                this._reconnectAttempts = 0;
                this._flushMessageQueue();
                ClientEvent.dispatchEvent(Constant.EVENT_TYPE.NETWORK_CONNECTED);
            };

            this._socket.onmessage = (event) => {
                this._handleMessage(event.data);
            };

            this._socket.onerror = (error) => {
                console.error('WebSocket error:', error);
                ClientEvent.dispatchEvent(Constant.EVENT_TYPE.NETWORK_ERROR, error);
            };

            this._socket.onclose = () => {
                console.log('WebSocket disconnected');
                this._isConnected = false;
                ClientEvent.dispatchEvent(Constant.EVENT_TYPE.NETWORK_DISCONNECTED);
                this._attemptReconnect();
            };
        } catch (error) {
            console.error('Failed to create WebSocket:', error);
            this._attemptReconnect();
        }
    }

    /**
     * 断开连接
     */
    public disconnect() {
        if (this._socket) {
            this._socket.close();
            this._socket = null;
        }
        this._isConnected = false;
        if (this._reconnectTimer !== -1) {
            clearTimeout(this._reconnectTimer);
            this._reconnectTimer = -1;
        }
        this._messageCache = {};
    }

    /**
     * 发送消息
     */
    public sendMessage(type: string, data: any) {
        // 检查是否需要节流
        if (type === 'player_sync') {
            const now = Date.now();
            if (now - this._lastSyncTime < this._syncInterval) {
                return;
            }
            this._lastSyncTime = now;
        }

        const message = {
            type,
            data,
            userId: PlayerData.instance.userId,
            timestamp: Date.now()
        };

        if (this._isConnected && this._socket && this._socket.readyState === WebSocket.OPEN) {
            this._socket.send(JSON.stringify(message));
        } else {
            // 消息队列，连接后重发
            this._messageQueue.push(message);
            if (!this._isConnected) {
                this.connect();
            }
        }
    }

    public joinRoom(roomId: string, playerInfo: any) {
        this.sendMessage('join_room', { roomId, playerInfo });
    }

    public attackPlayer(targetUserId: string, damage: number, attackerName: string) {
        this.sendMessage('player_attack', {
            targetUserId,
            damage,
            attackerName,
        });
    }

    /**
     * 处理接收到的消息
     */
    private _handleMessage(data: string) {
        try {
            const message = JSON.parse(data);
            
            // 消息去重
            const messageKey = `${message.type}_${message.userId}_${message.timestamp}`;
            if (this._messageCache[messageKey]) {
                return;
            }
            this._messageCache[messageKey] = true;
            
            // 清理过期消息缓存
            this._cleanMessageCache();
            
            console.log('Received message:', message);
            ClientEvent.dispatchEvent(`NETWORK_${message.type}`, message.data);
        } catch (error) {
            console.error('Failed to parse message:', error);
        }
    }

    /**
     * 尝试重连
     */
    private _attemptReconnect() {
        if (this._reconnectAttempts < this._maxReconnectAttempts) {
            this._reconnectAttempts++;
            console.log(`Attempting to reconnect... (${this._reconnectAttempts}/${this._maxReconnectAttempts})`);
            
            this._reconnectTimer = setTimeout(() => {
                this.connect();
            }, this._reconnectDelay * this._reconnectAttempts);
        } else {
            console.error('Max reconnection attempts reached');
            ClientEvent.dispatchEvent(Constant.EVENT_TYPE.NETWORK_RECONNECT_FAILED);
        }
    }

    /**
     * 发送队列中的消息
     */
    private _flushMessageQueue() {
        while (this._messageQueue.length > 0) {
            const message = this._messageQueue.shift();
            if (message) {
                this._socket?.send(JSON.stringify(message));
            }
        }
    }

    /**
     * 清理消息缓存
     */
    private _cleanMessageCache() {
        const now = Date.now();
        for (const key in this._messageCache) {
            const timestamp = parseInt(key.split('_').pop() || '0');
            if (now - timestamp > 5000) { // 清理5秒前的消息
                delete this._messageCache[key];
            }
        }
    }

    /**
     * 获取网络连接状态
     */
    public get isConnected() {
        return this._isConnected;
    }

    /**
     * 设置服务器地址
     */
    public set serverUrl(url: string) {
        this._serverUrl = url;
    }

    /**
     * 获取服务器地址
     */
    public get serverUrl() {
        return this._serverUrl;
    }

    /**
     * 设置同步间隔
     */
    public set syncInterval(interval: number) {
        this._syncInterval = interval;
    }

    /**
     * 获取同步间隔
     */
    public get syncInterval() {
        return this._syncInterval;
    }
}
