import { _decorator, Component, Label, Node, Vec3, find } from 'cc';
import { PlayerModel } from './playerModel';
import { GameManager } from './gameManager';
import { Constant } from '../framework/constant';
import { UIManager } from '../framework/uiManager';

const { ccclass } = _decorator;

@ccclass('RemotePlayer')
export class RemotePlayer extends Component {
    public userId: string = '';
    public playerName: string = '';
    public hp: number = 100;
    public level: number = 1;
    public isDie: boolean = false;

    private _targetPosition: Vec3 = new Vec3();
    private _nameNode: Node | null = null;
    private _nameLabel: Label | null = null;
    private _scriptPlayerModel: PlayerModel | null = null;
    private _lastPosition: Vec3 = new Vec3();

    public init(playerInfo: any) {
        this.userId = playerInfo.userId;
        this.playerName = playerInfo.name ?? '道友';
        this.hp = playerInfo.hp ?? 100;
        this.level = playerInfo.level ?? 1;
        this.isDie = this.hp <= 0;

        const playerScript = this.node.getComponent('Player') as Component | null;
        this._scriptPlayerModel = playerScript?.['scriptPlayerModel'] as PlayerModel;
        if (playerScript) {
            playerScript.enabled = false;
        }

        this._targetPosition.set(playerInfo.position?.x ?? 0, playerInfo.position?.y ?? 1.7, playerInfo.position?.z ?? 0);
        this.node.setWorldPosition(this._targetPosition);
        this._lastPosition.set(this.node.worldPosition);

        this._ensureNameNode();
        this._refreshName();

        if (this.isDie) {
            this._playDie();
        } else {
            this._scriptPlayerModel?.playAni(Constant.PLAYER_ANI_TYPE.IDLE, true);
        }
    }

    public applySync(playerInfo: any) {
        this.playerName = playerInfo.name ?? this.playerName;
        this.level = playerInfo.level ?? this.level;
        this.hp = playerInfo.hp ?? this.hp;
        this._targetPosition.set(
            playerInfo.position?.x ?? this.node.worldPosition.x,
            playerInfo.position?.y ?? this.node.worldPosition.y,
            playerInfo.position?.z ?? this.node.worldPosition.z
        );
        this._refreshName();

        if (this.hp <= 0 && !this.isDie) {
            this.isDie = true;
            this._playDie();
        }
    }

    public showHit(damage: number) {
        UIManager.instance.showBloodTips(this, Constant.FIGHT_TIP.REDUCE_BLOOD, -damage, new Vec3(-10, 150, 0));
    }

    private _ensureNameNode() {
        if (this._nameNode) {
            return;
        }

        const canvas = find('Canvas');
        if (!canvas) {
            return;
        }

        this._nameNode = new Node(`remoteName_${this.userId}`);
        this._nameLabel = this._nameNode.addComponent(Label);
        this._nameLabel.fontSize = 22;
        this._nameLabel.lineHeight = 24;
        this._nameNode.setParent(canvas);
    }

    private _refreshName() {
        if (this._nameLabel) {
            this._nameLabel.string = this.playerName;
        }
    }

    private _playDie() {
        this._scriptPlayerModel?.playAni(Constant.PLAYER_ANI_TYPE.DIE, false);
    }

    onDestroy() {
        if (this._nameNode?.isValid) {
            this._nameNode.destroy();
        }
    }

    update() {
        if (!this.node.parent) {
            return;
        }

        if (!this.isDie) {
            const currentPos = this.node.worldPosition.clone();
            this.node.setWorldPosition(Vec3.lerp(new Vec3(), currentPos, this._targetPosition, 0.35));
            const distance = Vec3.distance(this.node.worldPosition, this._lastPosition);
            if (distance > 0.03) {
                if (this._scriptPlayerModel && !this._scriptPlayerModel.isRunning) {
                    this._scriptPlayerModel.playAni(Constant.PLAYER_ANI_TYPE.RUN, true);
                }
            } else if (this._scriptPlayerModel && !this._scriptPlayerModel.isIdle) {
                this._scriptPlayerModel.playAni(Constant.PLAYER_ANI_TYPE.IDLE, true);
            }
            this._lastPosition.set(this.node.worldPosition);
        }

        if (this._nameNode && GameManager.mainCamera) {
            const uiPos = GameManager.mainCamera.convertToUINode(this.node.worldPosition, find('Canvas') as Node, new Vec3());
            uiPos.y += 170;
            this._nameNode.setPosition(uiPos);
        }
    }
}
