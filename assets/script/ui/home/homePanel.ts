import { _decorator, Component, Label, Sprite, SpriteFrame, Node, Vec3, Color } from 'cc';
import { UIManager } from './../../framework/uiManager';
import { PlayerData } from './../../framework/playerData';
import { ClientEvent } from '../../framework/clientEvent';
import { Constant } from '../../framework/constant';
import { AudioManager } from '../../framework/audioManager';
import * as i18n from '../../../../extensions/i18n/assets/LanguageData'
const LANGUAGE_LABEL_COLOR = {
    NONE: new Color(255, 255, 255),
    CHOOSE: new Color(226, 129, 24),
}
const { ccclass, property } = _decorator;
//主界面脚本
@ccclass('HomePanel')
export class HomePanel extends Component {
    @property(Label)
    public languageZhLabel: Label = null!;

    @property(Label)
    public languageEnLabel: Label = null!;

    @property(Node)
    dotNode: Node = null!;

    @property(Sprite)
    public spLevelName: Sprite = null!;

    @property(Label)
    public lbLevel: Label = null!;

    private _callback: Function = null!;
    private _curDotPos: Vec3 = new Vec3();//当前选中点的位置

    public show (callback?: Function) {

        this._initLanguage();

        this._callback = callback!;
        //已经解锁的最高层级
        this.lbLevel.string = `level ${PlayerData.instance.playerInfo.highestLevel}`;
    }

    public onBtnSettingClick () {
        UIManager.instance.showDialog("setting/settingPanel", [], () => { }, Constant.PRIORITY.DIALOG);
    }

    public onBtnStartClick () {
        AudioManager.instance.playSound(Constant.SOUND.HOME_PANEL_CLICK);


        // if (this._callback) {
        //     this._callback();
        // } else {
        ClientEvent.dispatchEvent(Constant.EVENT_TYPE.ON_GAME_INIT, () => {
            UIManager.instance.hideDialog("home/homePanel");
        });
        // }
    }

    private _initLanguage () {
        let ndDotPos = this.dotNode.position;
        if (i18n._language === Constant.I18_LANGUAGE.ENGLISH) {
            this._curDotPos.set(27, ndDotPos.y, ndDotPos.z);
            this.dotNode.setPosition(this._curDotPos);

            this.languageZhLabel.color = LANGUAGE_LABEL_COLOR.NONE;
            this.languageEnLabel.color = LANGUAGE_LABEL_COLOR.CHOOSE;
        } else {
            this._curDotPos.set(-27, ndDotPos.y, ndDotPos.z);
            this.dotNode.setPosition(this._curDotPos);

            this.languageZhLabel.color = LANGUAGE_LABEL_COLOR.CHOOSE;
            this.languageEnLabel.color = LANGUAGE_LABEL_COLOR.NONE;
        }
    }


    public changeLanguage () {
        let ndDotPos = this.dotNode.position;
        let nowLanguage;
        if (i18n._language === Constant.I18_LANGUAGE.CHINESE) {
            nowLanguage = Constant.I18_LANGUAGE.ENGLISH;

            this._curDotPos.set(27, ndDotPos.y, ndDotPos.z);
            this.dotNode.setPosition(this._curDotPos);

            this.languageZhLabel.color = LANGUAGE_LABEL_COLOR.NONE;
            this.languageEnLabel.color = LANGUAGE_LABEL_COLOR.CHOOSE;
        } else {
            nowLanguage = Constant.I18_LANGUAGE.CHINESE;

            this._curDotPos.set(-27, ndDotPos.y, ndDotPos.z);
            this.dotNode.setPosition(this._curDotPos);

            this.languageZhLabel.color = LANGUAGE_LABEL_COLOR.CHOOSE;
            this.languageEnLabel.color = LANGUAGE_LABEL_COLOR.NONE;
        }

        i18n.init(nowLanguage);
        i18n.updateSceneRenderers();
    }
}
