import { _decorator, Component, Node, SpriteComponent, LabelComponent } from 'cc';
import { LocalConfig } from './../../framework/localConfig';
import { GameManager } from './../../fight/gameManager';
import { SkillItem } from './skillItem';
import { Util } from './../../framework/util';
import { UIManager } from './../../framework/uiManager';
import { Constant } from './../../framework/constant';
import { PlayerData } from './../../framework/playerData';
import { AudioManager } from '../../framework/audioManager';
import * as i18n from '../../../../extensions/i18n/assets/LanguageData'
const { ccclass, property } = _decorator;
//技能界面脚本
@ccclass('SkillPanel')
export class SkillPanel extends Component {
    @property(Node)
    public ndSkills: Node = null!

    @property(SpriteComponent)
    public spRefreshIcon: SpriteComponent = null!;

    @property(LabelComponent)
    public lbGold: LabelComponent = null!;

    private _gold: number = 50;
    private _callback: Function = null!;

    public show (callback?: Function) {
        i18n.updateSceneRenderers();

        this._callback = callback!;

        if (i18n._language === Constant.I18_LANGUAGE.CHINESE) {
            this.lbGold.string = `获得 ${this._gold}`;
        } else {
            this.lbGold.string = `get ${this._gold}`;
        }

        let arrLock: any = PlayerData.instance.getLockPlyerSkill();
        arrLock = Util.shuffle(arrLock);

        this.ndSkills.children.forEach((ndChild: Node, idx: number, arr: any) => {
            if (arrLock[idx]) {
                let info: any = LocalConfig.instance.queryByID(Constant.playerSkillName(), arrLock[idx].ID);
                ndChild.active = true;
                let scriptItem = ndChild.getComponent(SkillItem) as SkillItem;
                scriptItem.init(info, () => {
                    this._close();
                });
            } else {
                ndChild.active = false;
            }
        })
    }

    public onBtnGiveUpClick () {
        AudioManager.instance.playSound(Constant.SOUND.SELL);

        GameManager.addGold(this._gold);
        this._close();
    }

    public onBtnRefreshClick () {
        this.show(this._callback);
    }

    private _close () {
        this._callback && this._callback();
        UIManager.instance.hideDialog("skill/skillPanel");
        UIManager.instance.showDialog("fight/fightPanel");
    }
}
