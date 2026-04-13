import { _decorator, Component, Label, Sprite, Node, Vec3, Color, EditBox } from 'cc';
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

    @property(EditBox)
    public nameEditBox: EditBox = null!;

    private _callback: Function = null!;
    private _curDotPos: Vec3 = new Vec3();

    public show(callback?: Function) {
        this._initLanguage();
        this._callback = callback!;
        this._refreshPlayerSummary();
        // 将用户名标签向下移动100px
        if (this.lbLevel) {
            const currentPos = this.lbLevel.node.position;
            this.lbLevel.node.setPosition(currentPos.x, currentPos.y - 100, currentPos.z);
        }
        // 显示当前用户名到输入框
        if (this.nameEditBox) {
            console.log('NameEditBox found, setting text:', PlayerData.instance.playerName);
            this.nameEditBox.string = PlayerData.instance.playerName;
            // 确保输入框是可编辑的
            this.nameEditBox.enabled = true;
            this.nameEditBox.interactable = true;
        } else {
            console.log('NameEditBox not found');
        }
    }

    public onBtnSettingClick() {
        UIManager.instance.showDialog("setting/settingPanel", [], () => { }, Constant.PRIORITY.DIALOG);
    }

    public onBtnStartClick() {
        AudioManager.instance.playSound(Constant.SOUND.HOME_PANEL_CLICK);
        ClientEvent.dispatchEvent(Constant.EVENT_TYPE.ON_GAME_INIT, () => {
            UIManager.instance.hideDialog("home/homePanel");
        });
    }

    public onBtnLeftClick() {
        const nextName = PlayerData.instance.rerollPlayerName();
        this._refreshPlayerSummary();
        UIManager.instance.showTips(`已随机命名：${nextName}`);
    }

    public onBtnRightClick() {
        //@ts-ignore
        const input = window.prompt?.('请输入角色名（2-6字）', PlayerData.instance.playerName);
        if (input === null || input === undefined) {
            return;
        }

        const isSuccess = PlayerData.instance.setPlayerName(input);
        if (!isSuccess) {
            UIManager.instance.showTips('名称需为2-6个字符');
            return;
        }

        this._refreshPlayerSummary();
        // 更新输入框内容
        if (this.nameEditBox) {
            this.nameEditBox.string = PlayerData.instance.playerName;
        }
        UIManager.instance.showTips(`已修改为：${PlayerData.instance.playerName}`);
    }

    public onNameEditBoxChanged(text: string) {
        // 输入框内容变化时的处理（可选）
        console.log('NameEditBox changed:', text);
    }

    public onNameEditBoxEnded(text: string) {
        // 当输入框结束编辑时，更新玩家名字
        console.log('NameEditBox ended:', text);
        const isSuccess = PlayerData.instance.setPlayerName(text);
        if (isSuccess) {
            this._refreshPlayerSummary();
            UIManager.instance.showTips(`已修改为：${PlayerData.instance.playerName}`);
        } else {
            // 如果名字无效，恢复原来的名字
            if (this.nameEditBox) {
                this.nameEditBox.string = PlayerData.instance.playerName;
            }
            UIManager.instance.showTips('名称需为2-6个字符');
        }
    }

    private _initLanguage() {
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

    public changeLanguage() {
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
        this._refreshPlayerSummary();
    }

    private _refreshPlayerSummary() {
        const playerName = PlayerData.instance.playerName;
        const highestLevel = PlayerData.instance.playerInfo.highestLevel;
        this.lbLevel.string = `${playerName} · level ${highestLevel}`;
    }
}
