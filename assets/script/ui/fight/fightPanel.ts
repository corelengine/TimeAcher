import { _decorator, Component, Node, Label } from 'cc';
import { UIManager } from './../../framework/uiManager';
import { BossBloodBar } from './bossBloodBar';
import { GameManager } from './../../fight/gameManager';
import { Util } from './../../framework/util';
import { PlayerData } from './../../framework/playerData';
import { Constant } from './../../framework/constant';
import { ClientEvent } from './../../framework/clientEvent';
import { LocalConfig } from '../../framework/localConfig';
import * as i18n from '../../../../extensions/i18n/assets/LanguageData'

const { ccclass, property } = _decorator;

@ccclass('FightPanel')
export class FightPanel extends Component {
    @property(Label)
    public lbUserName: Label = null!;

    @property(Node)
    public ndJoystick: Node = null!;

    @property(Label)
    public lbGold: Label = null!;

    @property(Label)
    public lbLevel: Label = null!;

    @property(Node)
    public ndBossBloodBar: Node = null!;

    private _debugClickTimes: number = 0;

    onEnable() {
        ClientEvent.on(Constant.EVENT_TYPE.REFRESH_GOLD, this._refreshGold, this);
        ClientEvent.on(Constant.EVENT_TYPE.REFRESH_LEVEL, this._refreshLevel, this);
        ClientEvent.on(Constant.EVENT_TYPE.REFRESH_PLAYER_NAME, this._refreshPlayerName, this);
    }

    onDisable() {
        ClientEvent.off(Constant.EVENT_TYPE.REFRESH_GOLD, this._refreshGold, this);
        ClientEvent.off(Constant.EVENT_TYPE.REFRESH_LEVEL, this._refreshLevel, this);
        ClientEvent.off(Constant.EVENT_TYPE.REFRESH_PLAYER_NAME, this._refreshPlayerName, this);
    }

    public show() {
        i18n.updateSceneRenderers();

        this.ndBossBloodBar.active = false;

        this._refreshPlayerName();
        this._refreshGold();
        this._refreshLevel();

        if (GameManager.ndBoss) {
            let bossInfo = LocalConfig.instance.queryByID("base", Constant.BASE.BOSS_01);
            let scriptBossBloodBar = this.ndBossBloodBar.getComponent(BossBloodBar) as BossBloodBar;
            scriptBossBloodBar.show(GameManager.scriptBoss, bossInfo.hp);
        }

        this._debugClickTimes = 0;
    }

    private _refreshGold() {
        this.lbGold.string = Util.formatMoney(PlayerData.instance.playerInfo.gold);
    }

    private _refreshPlayerName() {
        if (this.lbUserName) {
            this.lbUserName.string = PlayerData.instance.playerName;
        }
    }

    private _refreshLevel() {
        this.lbLevel.string = `level ${PlayerData.instance.playerInfo.level}`;
    }

    public onBtnPauseClick() {
        UIManager.instance.showDialog("pause/pausePanel", [], () => { }, Constant.PRIORITY.DIALOG);
        GameManager.isGamePause = true;
    }

    public onBtnDebugClick() {
        this._debugClickTimes += 1;

        if (this._debugClickTimes >= 1) {
            this._debugClickTimes = 0;
            UIManager.instance.showDialog("debug/debugPanel", [], () => { }, Constant.PRIORITY.DIALOG);
        }
    }
}
