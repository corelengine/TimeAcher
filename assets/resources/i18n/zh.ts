
const win = window as any;

export const languages = {
    "backPanel": {
        "title": "确认返回主界面？",
    },
    "fightPanel": {
        "tip": "滑动摇杆控制角色移动",
    },
    "revivePanel": {
        "txt": "到达层数",
        "revive": "复活",
        "skip": "跳过"
    },
    "settingPanel": {
        "title": "设置",
        "vibrator": "震动",
        "music": "音乐"
    },
    "settlementPanel": {
        "arrive": "到达层数",
        "getPower": "获得超能力",
    },
    "pausePanel": {
        "title": "超能力说明",
        "getPower": "获得超能力",
    },
    "shopPanel": {
        "title": "来看看一定有你想要的～",
        "refresh": "刷新",
    },
    "skillPanel": {
        "title": "选个你喜欢的超能力吧!",
        "abandon": "放弃",
        "get": "获得",
        "refresh": "刷新",
    },
    "debugPanel": {
        "title": "调试界面",
        "chooseLevel": "选择层级",
        "chooseSkill": "选择玩家技能",
        "clearPlayerData": "清除玩家缓存",
        "setFrameTime30": "设置为30帧",
        "setFrameTime60": "设置为60帧",
        "clearPlayerSkill": "清除玩家所有技能",
        "getAllSkill": "拥有玩家所有技能",
    }
};

if (!win.languages) {
    win.languages = {};
}

win.languages.zh = languages;