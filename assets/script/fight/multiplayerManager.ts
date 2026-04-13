import { _decorator, Component, Node } from 'cc';
import { ClientEvent } from '../framework/clientEvent';
import { Constant } from '../framework/constant';
import { NetworkManager } from '../framework/networkManager';
import { PlayerData } from '../framework/playerData';
import { GameManager } from './gameManager';
import { ResourceUtil } from '../framework/resourceUtil';
import { PoolManager } from '../framework/poolManager';
import { RemotePlayer } from './remotePlayer';
import { UIManager } from '../framework/uiManager';

const { ccclass } = _decorator;

@ccclass('MultiplayerManager')
export class MultiplayerManager extends Component {
    public static instance: MultiplayerManager | null = null;

    private _roomId: string = 'default';
    private _remotePlayers: Map<string, RemotePlayer> = new Map();
    private _joinedRoom: boolean = false;

    onLoad() {
        MultiplayerManager.instance = this;
    }

    onEnable() {
        ClientEvent.on(Constant.EVENT_TYPE.NETWORK_CONNECTED, this._onConnected, this);
        ClientEvent.on('NETWORK_room_info', this._onRoomInfo, this);
        ClientEvent.on('NETWORK_player_join', this._onPlayerJoin, this);
        ClientEvent.on('NETWORK_player_sync', this._onPlayerSync, this);
        ClientEvent.on('NETWORK_player_leave', this._onPlayerLeave, this);
        ClientEvent.on('NETWORK_player_attack', this._onPlayerAttack, this);
        ClientEvent.on('NETWORK_join_error', this._onJoinError, this);
        ClientEvent.on(Constant.EVENT_TYPE.ON_GAME_INIT, this._onGameInit, this);
    }

    onDisable() {
        ClientEvent.off(Constant.EVENT_TYPE.NETWORK_CONNECTED, this._onConnected, this);
        ClientEvent.off('NETWORK_room_info', this._onRoomInfo, this);
        ClientEvent.off('NETWORK_player_join', this._onPlayerJoin, this);
        ClientEvent.off('NETWORK_player_sync', this._onPlayerSync, this);
        ClientEvent.off('NETWORK_player_leave', this._onPlayerLeave, this);
        ClientEvent.off('NETWORK_player_attack', this._onPlayerAttack, this);
        ClientEvent.off('NETWORK_join_error', this._onJoinError, this);
        ClientEvent.off(Constant.EVENT_TYPE.ON_GAME_INIT, this._onGameInit, this);
    }

    start() {
        NetworkManager.instance.connect();
    }

    public attachLocalPlayer() {
        this._joinedRoom = false;
        this._tryJoinRoom();
    }

    private _onGameInit() {
        // 当游戏重新初始化时（比如关卡切换），重新加入房间
        console.log('MultiplayerManager: Game init, trying to join room');
        this._joinedRoom = false;
        // 清除之前的远程玩家，因为场景已经重新加载
        this._remotePlayers.forEach((remotePlayer) => {
            if (remotePlayer.node && remotePlayer.node.isValid) {
                PoolManager.instance.putNode(remotePlayer.node);
            }
        });
        this._remotePlayers.clear();
        GameManager.arrRemotePlayer = [];
        // 延迟一点时间，确保玩家节点已经创建
        setTimeout(() => {
            this._tryJoinRoom();
        }, 1000);
    }

    public syncLocalPlayer() {
        if (!this._joinedRoom || !GameManager.ndPlayer || !GameManager.scriptPlayer?.scriptBloodBar) {
            return;
        }

        NetworkManager.instance.sendMessage('player_sync', {
            position: GameManager.ndPlayer.worldPosition,
            hp: GameManager.scriptPlayer.scriptBloodBar.curBlood,
            level: PlayerData.instance.playerInfo.level,
            name: PlayerData.instance.playerName
        });
    }

    public attackRemotePlayer(targetUserId: string, damage: number) {
        if (!this._joinedRoom || !targetUserId) {
            return;
        }

        NetworkManager.instance.attackPlayer(targetUserId, damage, PlayerData.instance.playerName);
    }

    public getRemotePlayers() {
        return Array.from(this._remotePlayers.values()).map((item) => item.node);
    }

    private _onConnected() {
        this._tryJoinRoom();
    }

    private _tryJoinRoom() {
        if (this._joinedRoom || !GameManager.ndPlayer || !GameManager.scriptPlayer?.scriptBloodBar || !NetworkManager.instance.isConnected) {
            return;
        }

        NetworkManager.instance.joinRoom(this._roomId, {
            userId: PlayerData.instance.userId,
            name: PlayerData.instance.playerName,
            level: PlayerData.instance.playerInfo.level,
            hp: GameManager.scriptPlayer.scriptBloodBar.curBlood,
            position: GameManager.ndPlayer.worldPosition
        });
        this._joinedRoom = true;
    }

    private async _createOrUpdateRemotePlayer(playerInfo: any) {
        if (!playerInfo?.userId || playerInfo.userId === PlayerData.instance.userId) {
            return;
        }

        let remotePlayer = this._remotePlayers.get(playerInfo.userId);
        if (!remotePlayer) {
            const prefab = await ResourceUtil.loadModelRes('player/player01') as any;
            const node = PoolManager.instance.getNode(prefab, GameManager.ndGameManager) as Node;
            node.name = `remote_${playerInfo.userId}`;
            remotePlayer = node.getComponent(RemotePlayer) ?? node.addComponent(RemotePlayer);
            remotePlayer.init(playerInfo);
            this._remotePlayers.set(playerInfo.userId, remotePlayer);
            GameManager.arrRemotePlayer = this.getRemotePlayers();
        } else {
            remotePlayer.applySync(playerInfo);
        }
    }

    private _onRoomInfo(data: any) {
        if (Array.isArray(data?.players)) {
            data.players.forEach((player: any) => {
                this._createOrUpdateRemotePlayer(player);
            });
        }
    }

    private _onPlayerJoin(data: any) {
        this._createOrUpdateRemotePlayer(data);
    }

    private _onPlayerSync(data: any) {
        this._createOrUpdateRemotePlayer(data);
    }

    private _onPlayerLeave(data: any) {
        const remotePlayer = this._remotePlayers.get(data?.userId);
        if (!remotePlayer) {
            return;
        }

        this._remotePlayers.delete(data.userId);
        GameManager.arrRemotePlayer = this.getRemotePlayers();
        PoolManager.instance.putNode(remotePlayer.node);
    }

    private _onPlayerAttack(data: any) {
        if (data?.targetUserId !== PlayerData.instance.userId || !GameManager.scriptPlayer) {
            return;
        }

        GameManager.scriptPlayer.reduceBloodByValue(data.damage, data.attackerName);
    }

    private _onJoinError(data: any) {
        this._joinedRoom = false;
        if (data?.reason === 'room_full') {
            UIManager.instance.showTips(`房间已满，最多${data.maxPlayers}人`);
        }
    }

    update() {
        this.syncLocalPlayer();
    }
}
