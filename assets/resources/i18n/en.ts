
const win = window as any;

export const languages = {
    "backPanel": {
        "title": "Are you sure to return to the main screen?",
    },
    "fightPanel": {
        "tip": "Sliding joysticks control character movement",
    },
    "revivePanel": {
        "txt": "Arrival level",
        "revive": "revive",
        "skip": "skip"
    },
    "settingPanel": {
        "title": "setting",
        "vibrator": "vibrator",
        "music": "music"
    },
    "settlementPanel": {
        "arrive": "Arrival level",
        "getPower": "Get superpowers",
    },
    "pausePanel": {
        "title": "Superpower specification",
        "getPower": "Get superpowers",
    },
    "shopPanel": {
        "title": "There must be something you want to see",
        "refresh": "refresh",
    },
    "skillPanel": {
        "title": "Pick a superpower you like!",
        "abandon": "abandon",
        "get": "get",
        "refresh": "refresh",
    },
    "debugPanel": {
        "title": "Debugging interface",
        "chooseLevel": "Selection level",
        "chooseSkill": "Select player skills",
        "clearPlayerData": "Clear player cache",
        "setFrameTime30": "Set to 30 frames",
        "setFrameTime60": "Set to 60 frames",
        "clearPlayerSkill": "Clear all player skills",
        "getAllSkill": "Has all the player's skills",
    }
};

if (!win.languages) {
    win.languages = {};
}

win.languages.en = languages;