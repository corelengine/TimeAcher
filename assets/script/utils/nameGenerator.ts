const FAMILY_NAMES = [
    "云", "苏", "沈", "叶", "林", "陆", "楚", "顾", "白", "温",
    "萧", "慕", "秦", "洛", "夜", "宁", "墨", "风", "凌", "玄",
];

const GIVEN_NAMES = [
    "长歌", "清辞", "若尘", "星河", "无尘", "流云", "千雪", "青岚", "玄霄", "惊鸿",
    "扶摇", "忘川", "听雨", "寒舟", "月白", "沐尘", "临渊", "知夏", "青冥", "逐月",
    "飞霜", "映雪", "天问", "归鸿", "灵汐", "昭宁", "朝槿", "问心", "静姝", "澄怀",
];

function randomPick(source: string[]) {
    return source[Math.floor(Math.random() * source.length)];
}

export class NameGenerator {
    public static generateXianxiaName() {
        return `${randomPick(FAMILY_NAMES)}${randomPick(GIVEN_NAMES)}`;
    }

    public static sanitizeName(input: string) {
        return input.replace(/\s+/g, "").trim().slice(0, 6);
    }

    public static isValidName(input: string) {
        const value = this.sanitizeName(input);
        return value.length >= 2 && value.length <= 6;
    }
}
