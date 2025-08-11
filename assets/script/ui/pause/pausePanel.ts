import { _decorator, Component, Node, Sprite, Label, SpriteFrame } from 'cc';
import { ClientEvent } from './../../framework/clientEvent';
import { Constant } from './../../framework/constant';
import { GameManager } from './../../fight/gameManager';
import { UIManager } from './../../framework/uiManager';
import { SkillList } from './skillList';
import { AudioManager } from '../../framework/audioManager';
import { ResourceUtil } from '../../framework/resourceUtil';
import { PlayerData } from '../../framework/playerData';
import * as i18n from '../../../../extensions/i18n/assets/LanguageData'

const { ccclass, property } = _decorator;
//暂停界面脚本
@ccclass('PausePanel')
export class PausePanel extends Component {
    @property(Sprite)
    public spSkillIcon: Sprite = null!;

    @property(Label)
    public lbSkillName: Label = null!;

    @property(Label)
    public lbSkillDesc: Label = null!;

    @property(Node)
    public ndSkillList: Node = null!;

    @property(SpriteFrame)
    public sfMusicOn: SpriteFrame = null!;

    @property(SpriteFrame)
    public sfMusicOff: SpriteFrame = null!;

    @property(Sprite)
    public spBtnSound: Sprite = null!;

    @property(Node)
    public ndSkillItem: Node = null!;

    private _isAudioOpen: boolean = false;//是否开启音乐

    public show () {
        i18n.updateSceneRenderers();

        let arrSkill = PlayerData.instance.playerInfo.arrSkill;
        if (!arrSkill.length) {
            this.ndSkillItem.active = false;
            this.ndSkillList.active = false;
        } else {
            this.ndSkillItem.active = true;
            this.ndSkillList.active = true;

            let scriptSkillList = this.ndSkillList.getComponent(SkillList) as SkillList;

            scriptSkillList.init((itemInfo: any) => {
                this.lbSkillName.string = itemInfo.name;
                this.lbSkillDesc.string = itemInfo.desc;
                ResourceUtil.setSpriteFrame(`texture/skillIcon/${itemInfo.icon}`, this.spSkillIcon);
            });
        }

        this._isAudioOpen = AudioManager.instance.getAudioSetting(true);
        this.changeState();
    }

    public changeState () {
        if (this._isAudioOpen) {
            this.spBtnSound.spriteFrame = this.sfMusicOn;
        } else {
            this.spBtnSound.spriteFrame = this.sfMusicOff;
        }
    }

    public onBtnSoundClick () {
        this._isAudioOpen = !this._isAudioOpen;
        this.changeState();

        AudioManager.instance.switchSound(this._isAudioOpen);
        AudioManager.instance.switchMusic(this._isAudioOpen);
    }

    public onBtnHomeClick () {
        UIManager.instance.showDialog("back/backPanel", [() => {
            UIManager.instance.hideDialog("fight/fightPanel");
            UIManager.instance.hideDialog("pause/pausePanel");
            GameManager.isGameOver = true;
            ClientEvent.dispatchEvent(Constant.EVENT_TYPE.RECYCLE_ALL);
            UIManager.instance.showDialog("home/homePanel");
        }], () => { }, Constant.PRIORITY.WAITING);
    }

    public onBtnPlayClick () {
        UIManager.instance.hideDialog("pause/pausePanel");
        GameManager.isGamePause = false;
    }
}
