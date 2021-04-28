"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Parser = void 0;
const _ = require("lodash");
require("./utils");
const miscTags_1 = require("./constants/miscTags");
const vect_1 = require("./constants/vect");
const xp_1 = require("./constants/xp");
const size_1 = require("./constants/size");
const damage_1 = require("./constants/damage");
const senses_1 = require("./constants/senses");
const sources_1 = require("./constants/sources");
const duration_1 = require("./constants/duration");
const time_1 = require("./constants/time");
const schools_1 = require("./constants/schools");
class Parser {
}
exports.Parser = Parser;
Parser._parse_aToB = (abMap, a, fallback = undefined) => {
    if (a === undefined || a === null)
        throw new TypeError('undefined or null object passed to parser');
    if (typeof a === 'string')
        a = a.trim();
    if (abMap[a] !== undefined)
        return abMap[a];
    return fallback !== undefined ? fallback : a;
};
Parser._parse_bToA = (abMap, b) => {
    if (b === undefined || b === null)
        throw new TypeError('undefined or null object passed to parser');
    if (typeof b === 'string')
        b = b.trim();
    for (const v in abMap) {
        if (!abMap.hasOwnProperty(v))
            continue;
        if (abMap[v] === b)
            return v;
    }
    return b;
};
Parser._addCommas = (intNum) => {
    return `${intNum}`.replace(/(\d)(?=(\d{3})+$)/g, '$1,');
};
Parser.getSpeedString = (it) => {
    if (it.speed == null)
        return '\u2014';
    function procSpeed(propName) {
        function addSpeed(s) {
            stack.push(`${propName === 'walk' ? '' : `${propName} `}${getVal(s)} ft.${getCond(s)}`);
        }
        if (it.speed[propName] || propName === 'walk')
            addSpeed(it.speed[propName] || 0);
        if (it.speed.alternate && it.speed.alternate[propName])
            it.speed.alternate[propName].forEach(addSpeed);
    }
    function getVal(speedProp) {
        return speedProp.number != null ? speedProp.number : speedProp;
    }
    function getCond(speedProp) {
        return speedProp.condition ? ` ${speedProp.condition}` : '';
    }
    const stack = [];
    if (typeof it.speed === 'object') {
        let joiner = ', ';
        procSpeed('walk');
        procSpeed('burrow');
        procSpeed('climb');
        procSpeed('fly');
        procSpeed('swim');
        if (it.speed.choose) {
            joiner = '; ';
            stack.push(`${it.speed.choose.from.sort().joinConjunct(', ', ' or ')} ${it.speed.choose.amount} ft.${it.speed.choose.note ? ` ${it.speed.choose.note}` : ''}`);
        }
        return stack.join(joiner);
    }
    else {
        return it.speed + (it.speed === 'Varies' ? '' : ' ft. ');
    }
};
Parser.alignmentAbvToFull = (alignment) => {
    if (!alignment)
        return null; // used in sidekicks
    if (typeof alignment === 'object') {
        if (alignment.special != null) {
            // use in MTF Sacred Statue
            return alignment.special;
        }
        else {
            // e.g. `{alignment: ["N", "G"], chance: 50}` or `{alignment: ["N", "G"]}`
            return `${alignment.alignment.map((a) => Parser.alignmentAbvToFull(a)).join(' ')}${alignment.chance ? ` (${alignment.chance}%)` : ''}${alignment.note ? ` (${alignment.note})` : ''}`;
        }
    }
    else {
        alignment = alignment.toUpperCase();
        switch (alignment) {
            case 'L':
                return 'lawful';
            case 'N':
                return 'neutral';
            case 'NX':
                return 'neutral (law/chaos axis)';
            case 'NY':
                return 'neutral (good/evil axis)';
            case 'C':
                return 'chaotic';
            case 'G':
                return 'good';
            case 'E':
                return 'evil';
            // "special" values
            case 'U':
                return 'unaligned';
            case 'A':
                return 'any alignment';
        }
        return alignment;
    }
};
Parser.acToFull = (ac) => {
    if (typeof ac === 'string')
        return ac; // handle classic format
    let stack = '';
    let inBraces = false;
    for (let i = 0; i < ac.length; ++i) {
        const cur = ac[i];
        const nxt = ac[i + 1];
        if (cur.special != null) {
            if (inBraces)
                inBraces = false;
            stack += cur.special;
        }
        else if (cur.ac) {
            const isNxtBraces = nxt && nxt.braces;
            if (!inBraces && cur.braces) {
                stack += '(';
                inBraces = true;
            }
            stack += cur.ac;
            if (cur.from) {
                // always brace nested braces
                if (cur.braces) {
                    stack += ' (';
                }
                else {
                    stack += inBraces ? '; ' : ' (';
                }
                inBraces = true;
                stack += cur.from.map((it) => it).join(', ');
                if (cur.braces) {
                    stack += ')';
                }
                else if (!isNxtBraces) {
                    stack += ')';
                    inBraces = false;
                }
            }
            if (cur.condition)
                stack += ` ${cur.condition}`;
            if (inBraces && !isNxtBraces) {
                stack += ')';
                inBraces = false;
            }
        }
        else {
            stack += cur;
        }
        if (nxt) {
            if (nxt.braces) {
                stack += inBraces ? '; ' : ' (';
                inBraces = true;
            }
            else
                stack += ', ';
        }
    }
    if (inBraces)
        stack += ')';
    return stack.trim();
};
Parser.miscTagsToFull = (tags = []) => {
    return tags.map((tag) => {
        return miscTags_1.MISC_TAG_TO_FULL[tag] || '';
    });
};
Parser.crToNumber = (cr) => {
    if (cr === 'Unknown' || cr === '\u2014' || cr == null)
        return vect_1.VeCt.CR_UNKNOWN;
    if (cr.cr)
        return Parser.crToNumber(cr.cr);
    if (cr.coven)
        return Parser.crToNumber(cr.coven);
    const parts = cr.trim().split('/');
    if (parts.length === 1) {
        if (isNaN(parts[0]))
            return vect_1.VeCt.CR_CUSTOM;
        return Number(parts[0]);
    }
    else if (parts.length === 2) {
        if (isNaN(parts[0]) || isNaN(Number(parts[1])))
            return vect_1.VeCt.CR_CUSTOM;
        return Number(parts[0]) / Number(parts[1]);
    }
    else
        return 0;
};
Parser.crToXp = function (cr, { isDouble = false } = {}) {
    if (cr != null && cr.xp)
        return Parser._addCommas(`${isDouble ? cr.xp * 2 : cr.xp}`);
    const toConvert = cr ? cr.cr || cr : null;
    if (toConvert === 'Unknown' || toConvert == null || !xp_1.XP_CHART_ALT)
        return 'Unknown';
    if (toConvert === '0')
        return '0 or 10';
    const xp = xp_1.XP_CHART_ALT[toConvert];
    return Parser._addCommas(`${isDouble ? 2 * xp : xp}`);
};
Parser.monCrToFull = (cr, { xp = '', isMythic = false } = {}) => {
    if (cr == null)
        return '';
    if (typeof cr === 'string') {
        if (Parser.crToNumber(cr) >= vect_1.VeCt.CR_CUSTOM)
            return cr;
        xp = xp != null ? Parser._addCommas(xp) : Parser.crToXp(cr);
        return `${cr} (${xp} XP${isMythic
            ? `, or ${Parser.crToXp(cr, {
                isDouble: true,
            })} XP as a mythic encounter`
            : ''})`;
    }
    else {
        const stack = [Parser.monCrToFull(cr.cr, { xp: cr.xp, isMythic })];
        if (cr.lair)
            stack.push(`${Parser.monCrToFull(cr.lair)} when encountered in lair`);
        if (cr.coven)
            stack.push(`${Parser.monCrToFull(cr.coven)} when part of a coven`);
        return stack.joinConjunct(', ', ' or ');
    }
};
Parser.sizeAbvToFull = function (abv) {
    return Parser._parse_aToB(size_1.SIZE_ABV_TO_FULL, abv, undefined);
};
Parser.dmgTypeToFull = (dmgType = []) => {
    return dmgType.map((dmg) => {
        return damage_1.DMGTYPE_JSON_TO_FULL[dmg];
    });
};
Parser.senseToExplanation = (senseType) => {
    senseType = senseType.toLowerCase();
    return Parser._parse_aToB(senses_1.SENSE_JSON_TO_FULL, senseType, ['No explanation available.']);
};
Parser.senseToObject = (senses = []) => {
    return senses.map((sense) => {
        return {
            [sense]: Parser.senseToExplanation(sense.split(' ')[0]),
        };
    });
};
Parser.getOfficialSpellClass = (classList = []) => {
    if (_.isEmpty(classList))
        return [];
    const officials = classList.map((classItem) => {
        if (Object.keys(sources_1.OFFICIAL_SOURCES).includes(classItem.source)) {
            return `{@class ${classItem.name.toLowerCase()}|${classItem.source.toLowerCase()}}`;
        }
    });
    return officials.filter((x) => !!x);
};
Parser.getOfficialSpellSubclass = (classList = []) => {
    if (_.isEmpty(classList))
        return [];
    const officials = classList.map((classItem) => {
        var _a, _b;
        if (Object.keys(sources_1.OFFICIAL_SOURCES).includes((_a = classItem.class) === null || _a === void 0 ? void 0 : _a.source) &&
            Object.keys(sources_1.OFFICIAL_SOURCES).includes((_b = classItem.subclass) === null || _b === void 0 ? void 0 : _b.source)) {
            return (`{@subclass ${classItem.subclass.name.toLowerCase()}|${classItem.subclass.source.toLowerCase()}} ` +
                `{@class ${classItem.class.name.toLowerCase()}|${classItem.class.source.toLowerCase()}}`);
        }
    });
    return officials.filter((x) => !!x);
};
Parser.spComponentsToFull = (comp, level) => {
    if (!comp)
        return 'None';
    const out = [];
    if (comp.v)
        out.push('V');
    if (comp.s)
        out.push('S');
    if (comp.m != null)
        out.push(`M${comp.m !== true ? ` (${comp.m.text != null ? comp.m.text : comp.m})` : ''}`);
    if (comp.r)
        out.push(`R (${level} gp)`);
    return out || ['None'];
};
Parser.spDurationToFull = (dur) => {
    let hasSubOr = false;
    const outParts = dur.map((d) => {
        switch (d.type) {
            case 'special':
                return 'Special';
            case 'instant':
                return `Instantaneous${d.condition ? ` (${d.condition})` : ''}`;
            case 'timed':
                return `${d.concentration ? 'Concentration, ' : ''}${d.concentration ? 'u' : d.duration.upTo ? 'U' : ''}${d.concentration || d.duration.upTo ? 'p to ' : ''}${d.duration.amount} ${d.duration.amount === 1 ? d.duration.type : `${d.duration.type}s`}`;
            case 'permanent': {
                if (d.ends) {
                    const endsToJoin = d.ends.map((m) => Parser._parse_aToB(duration_1.SP_END_TYPE_TO_FULL, m));
                    hasSubOr = hasSubOr || endsToJoin.length > 1;
                    return `Until ${endsToJoin.joinConjunct(', ', ' or ')}`;
                }
                else {
                    return 'Permanent';
                }
            }
        }
    });
    return `${outParts.joinConjunct(hasSubOr ? '; ' : ', ', ' or ')}${dur.length > 1 ? ' (see below)' : ''}`;
};
Parser.spTime = (time) => {
    const text = time.map((timeItem) => {
        return {
            full: `${timeItem.number} ${!_.isEmpty(timeItem.unit) ? Parser._parse_aToB(time_1.SP_TIME_TO_FULL, timeItem.unit) : ''}`,
            short: `${timeItem.number} ${!_.isEmpty(timeItem.unit) ? Parser._parse_aToB(time_1.SP_TIME_TO_ABV, timeItem.unit) : ''}`,
        };
    });
    return {
        text,
        details: time,
    };
};
Parser.spRange = (range) => {
    return range;
};
Parser.spSchool = (school) => {
    return Parser._parse_aToB(schools_1.SP_SCHOOL_ABV_TO_FULL, school);
};
Parser.spSubschools = (subschools = []) => {
    return subschools
        .map((school) => {
        return Parser._parse_aToB(schools_1.SP_SCHOOL_ABV_TO_FULL, school);
    })
        .filter((x) => !!x);
};
//# sourceMappingURL=parser.js.map