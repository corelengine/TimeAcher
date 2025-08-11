import { _decorator, Component, Node, Sprite } from 'cc';
import { ShopItem } from './shopItem';
import { Util } from './../../framework/util';
import { UIManager } from './../../framework/uiManager';
import { PlayerData } from './../../framework/playerData';
import { LocalConfig } from '../../framework/localConfig';
import { Constant } from '../../framework/constant';
import * as i18n from '../../../../extensions/i18n/assets/LanguageData'

const { ccclass, property } = _decorator;
//商店脚本
@ccclass('ShopPanel')
export class ShopPanel extends Component {
    @property(Node)
    public ndSkills: Node = null!;

    @property(Sprite)
    public spRefreshIcon: Sprite = null!;

    private _callback: Function = null!;

    public show (callback?: Function) {
        i18n.updateSceneRenderers();
        this._callback = callback!;

        let arrLock: any = PlayerData.instance.getLockPlyerSkill();
        arrLock = Util.shuffle(arrLock);

        this.ndSkills.children.forEach((ndChild: Node, idx: number, arr: any) => {
            if (arrLock[idx]) {
                let info: any = LocalConfig.instance.queryByID(Constant.playerSkillName(), arrLock[idx].ID);
                ndChild.active = true;
                let scriptItem = ndChild.getComponent(ShopItem) as ShopItem;
                scriptItem.init(info, () => {
                    this._close();
                });
            } else {
                ndChild.active = false;
            }
        })
    }

    public onBtnGiveUpClick () {
        this._close();
    }

    public onBtnRefreshClick () {
        this.show(this._callback);
    }

    private _close () {
        this._callback && this._callback();
        UIManager.instance.hideDialog("shop/shopPanel");
        UIManager.instance.showDialog("fight/fightPanel");
    }

    public onBtnCloseClick () {
        this._close();
    }
}