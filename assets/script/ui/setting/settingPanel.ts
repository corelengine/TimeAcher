import { _decorator, Component, Node, SpriteFrame, Sprite, Vec3, profiler, Label } from 'cc';
import { UIManager } from './../../framework/uiManager';
import { AudioManager } from './../../framework/audioManager';
import { StorageManager } from '../../framework/storageManager';
import * as i18n from '../../../../extensions/i18n/assets/LanguageData'
import { Constant } from '../../framework/constant';

const { ccclass, property } = _decorator;
//设置界面脚本
@ccclass('SettingPanel')
export class SettingPanel extends Component {
    @property(SpriteFrame)
    public sfSelect: SpriteFrame = null!;

    @property(SpriteFrame)
    public sfUnSelect: SpriteFrame = null!;

    @property(Node)
    public ndBtnVibration: Node = null!;

    @property(Node)
    public ndBtnMusic: Node = null!;

    @property(Node)
    public ndBtnDebug: Node = null!;

    private _isAudioOpen: boolean = false;
    private _isVibrationOpen: boolean = false;
    private _isDebugOpen: boolean = false;
    private _curDotPos: Vec3 = new Vec3();//当前选中点的位置

    public show () {
        i18n.updateSceneRenderers();

        this._isAudioOpen = AudioManager.instance.getAudioSetting(true);
        this._changeState(this.ndBtnMusic, this._isAudioOpen);

        this._isVibrationOpen = StorageManager.instance.getGlobalData("vibration") ?? true;
        this._changeState(this.ndBtnVibration, this._isVibrationOpen);

        this._isDebugOpen = StorageManager.instance.getGlobalData("debug") ?? false;
        this._changeState(this.ndBtnDebug, this._isDebugOpen);
    }

    private _changeState (ndParget: Node, isOpen: boolean) {
        let spCom = ndParget.getComponent(Sprite) as Sprite;
        let ndDot = ndParget.getChildByName("dot") as Node;
        let lbTxt = ndDot.getChildByName("txt")?.getComponent(Label) as Label;
        let ndDotPos = ndDot.position;

        if (isOpen) {
            spCom.spriteFrame = this.sfSelect;
            this._curDotPos.set(24, ndDotPos.y, ndDotPos.z);
            ndDot.setPosition(this._curDotPos);
            if (i18n._language === Constant.I18_LANGUAGE.CHINESE) {
                lbTxt.string = "开";
            } else {
                lbTxt.string = "on";
            }
        } else {
            spCom.spriteFrame = this.sfUnSelect;
            this._curDotPos.set(-24, ndDotPos.y, ndDotPos.z);
            ndDot.setPosition(this._curDotPos);
            if (i18n._language === Constant.I18_LANGUAGE.CHINESE) {
                lbTxt.string = "关";
            } else {
                lbTxt.string = "off";
            }
        }
    }

    public onBtnVibrationClick () {
        this._isVibrationOpen = !this._isVibrationOpen;
        this._changeState(this.ndBtnVibration, this._isVibrationOpen);
        StorageManager.instance.setGlobalData("vibration", this._isVibrationOpen);
    }

    public onBtnMusicClick () {
        this._isAudioOpen = !this._isAudioOpen;
        this._changeState(this.ndBtnMusic, this._isAudioOpen);

        AudioManager.instance.switchSound(this._isAudioOpen);
        AudioManager.instance.switchMusic(this._isAudioOpen);
    }

    public onBtnDebugClick () {
        this._isDebugOpen = !this._isDebugOpen;
        this._changeState(this.ndBtnDebug, this._isDebugOpen);
        StorageManager.instance.setGlobalData("debug", this._isDebugOpen);

        this._isDebugOpen === true ? profiler.showStats() : profiler.hideStats();
    }

    public onBtnCloseClick () {
        UIManager.instance.hideDialog("setting/settingPanel");
    }

}
