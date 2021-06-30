import * as _ from 'lodash';
import './utils';
import { MISC_TAG_TO_FULL } from './constants/miscTags';
import { VeCt } from './constants/vect';
import { XP_CHART_ALT } from './constants/xp';
import { SIZE_ABV_TO_FULL } from './constants/size';
import { DMGTYPE_JSON_TO_FULL } from './constants/damage';
import { SENSE_JSON_TO_FULL } from './constants/senses';
import { OFFICIAL_SOURCES } from './constants/sources';
import { SP_END_TYPE_TO_FULL } from './constants/duration';
import { SP_TIME_TO_ABV, SP_TIME_TO_FULL } from './constants/time';
import { SP_SCHOOL_ABV_TO_FULL, SP_SCHOOL_ABV_TO_SHORT } from './constants/schools';

class Parser {
  static _parseAToB = (abMap: any, a: any, fallback: any = undefined) => {
    if (a === undefined || a === null) throw new TypeError('undefined or null object passed to parser');
    if (typeof a === 'string') a = a.trim();
    if (abMap[a] !== undefined) return abMap[a];
    return fallback !== undefined ? fallback : a;
  };

  static _parseBToA = (abMap: any, b: any) => {
    if (b === undefined || b === null) throw new TypeError('undefined or null object passed to parser');
    if (typeof b === 'string') b = b.trim();
    for (const v in abMap) {
      if (!abMap.hasOwnProperty(v)) continue;
      if (abMap[v] === b) return v;
    }
    return b;
  };

  static _addCommas = (intNum: string): string => {
    return `${intNum}`.replace(/(\d)(?=(\d{3})+$)/g, '$1,');
  };

  static getFullSource = (source: any): any => {
    if (source && source.source) return Parser._parseAToB(OFFICIAL_SOURCES, source.source);
    return Parser._parseAToB(OFFICIAL_SOURCES, source);
  };

  static getCreatureType = (creatureType: any): any => {
    if (creatureType && creatureType.type) {
      return {
        name: creatureType.type,
        swarmSize: creatureType.swarmSize || null,
      };
    }
    return {
      name: creatureType,
      swarmSize: null,
    };
  };

  static getSpeedString = (it: any) => {
    if (it.speed == null) return '\u2014';

    function procSpeed(propName: string) {
      function addSpeed(s: any) {
        // stack.push(`${propName === 'walk' ? '' : `${propName} `}${getVal(s)} ft.${getCond(s)}`);
        stack.push(`${propName} ${getVal(s)} ft.${getCond(s)}`);
      }

      if (it.speed[propName] || propName === 'walk') addSpeed(it.speed[propName] || 0);
      if (it.speed.alternate && it.speed.alternate[propName]) it.speed.alternate[propName].forEach(addSpeed);
    }

    function getVal(speedProp: any) {
      return speedProp.number != null ? speedProp.number : speedProp;
    }

    function getCond(speedProp: any) {
      return speedProp.condition ? ` ${speedProp.condition}` : '';
    }

    const stack: any = [];
    if (typeof it.speed === 'object') {
      let joiner = ', ';
      procSpeed('walk');
      procSpeed('burrow');
      procSpeed('climb');
      procSpeed('fly');
      procSpeed('swim');
      if (it.speed.choose) {
        joiner = '; ';
        stack.push(
          `${it.speed.choose.from.sort().joinConjunct(', ', ' or ')} ${it.speed.choose.amount} ft.${
            it.speed.choose.note ? ` ${it.speed.choose.note}` : ''
          }`,
        );
      }
      return stack.join(joiner);
    } else {
      return it.speed + (it.speed === 'Varies' ? '' : ' ft. ');
    }
  };

  static alignmentAbvToFull = (alignment: any) => {
    if (!alignment) return null; // used in sidekicks
    if (typeof alignment === 'object') {
      if (alignment.special != null) {
        // use in MTF Sacred Statue
        return alignment.special;
      } else {
        // e.g. `{alignment: ["N", "G"], chance: 50}` or `{alignment: ["N", "G"]}`
        return `${alignment.alignment.map((a: any) => Parser.alignmentAbvToFull(a)).join(' ')}${
          alignment.chance ? ` (${alignment.chance}%)` : ''
        }${alignment.note ? ` (${alignment.note})` : ''}`;
      }
    } else {
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

  static acToFull = (ac: any) => {
    if (typeof ac === 'string') return ac; // handle classic format

    let stack = '';
    let inBraces = false;
    for (let i = 0; i < ac.length; ++i) {
      const cur = ac[i];
      const nxt = ac[i + 1];

      if (cur.special != null) {
        if (inBraces) inBraces = false;

        stack += cur.special;
      } else if (cur.ac) {
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
          } else {
            stack += inBraces ? '; ' : ' (';
          }

          inBraces = true;

          stack += cur.from.map((it: any) => it).join(', ');

          if (cur.braces) {
            stack += ')';
          } else if (!isNxtBraces) {
            stack += ')';
            inBraces = false;
          }
        }

        if (cur.condition) stack += ` ${cur.condition}`;

        if (inBraces && !isNxtBraces) {
          stack += ')';
          inBraces = false;
        }
      } else {
        stack += cur;
      }

      if (nxt) {
        if (nxt.braces) {
          stack += inBraces ? '; ' : ' (';
          inBraces = true;
        } else stack += ', ';
      }
    }
    if (inBraces) stack += ')';

    return stack.trim();
  };

  static miscTagsToFull = (tags = []) => {
    return tags.map((tag) => {
      return MISC_TAG_TO_FULL[tag] || '';
    });
  };

  static crToNumber = (cr: any): number => {
    if (cr === 'Unknown' || cr === '\u2014' || cr == null) return VeCt.CR_UNKNOWN;
    if (cr.cr) return Parser.crToNumber(cr.cr);
    if (cr.coven) return Parser.crToNumber(cr.coven);

    const parts = cr.trim().split('/');

    if (parts.length === 1) {
      if (isNaN(parts[0])) return VeCt.CR_CUSTOM;
      return Number(parts[0]);
    } else if (parts.length === 2) {
      if (isNaN(parts[0]) || isNaN(Number(parts[1]))) return VeCt.CR_CUSTOM;
      return Number(parts[0]) / Number(parts[1]);
    } else return 0;
  };

  static crToXp = (cr: any, { isDouble = false } = {}) => {
    if (cr != null && cr.xp) return Parser._addCommas(`${isDouble ? cr.xp * 2 : cr.xp}`);

    const toConvert = cr ? cr.cr || cr : null;
    if (toConvert === 'Unknown' || toConvert == null || !XP_CHART_ALT) return 'Unknown';
    if (toConvert === '0') return '0 or 10';
    const xp = XP_CHART_ALT[toConvert];
    return Parser._addCommas(`${isDouble ? 2 * xp : xp}`);
  };

  static monCrToFull = (cr: any, { xp = '', isMythic = false } = {}): any => {
    if (cr == null) return '';

    if (typeof cr === 'string') {
      if (Parser.crToNumber(cr) >= VeCt.CR_CUSTOM) return cr;

      xp = xp != '' ? Parser._addCommas(xp) : Parser.crToXp(cr);
      return `${cr} (${xp} XP${
        isMythic
          ? `, or ${Parser.crToXp(cr, {
              isDouble: true,
            })} XP as a mythic encounter`
          : ''
      })`;
    } else {
      const stack: any = [Parser.monCrToFull(cr.cr, { xp: cr.xp, isMythic })];
      if (cr.lair) stack.push(`${Parser.monCrToFull(cr.lair)} when encountered in lair`);
      if (cr.coven) stack.push(`${Parser.monCrToFull(cr.coven)} when part of a coven`);
      return stack.joinConjunct(', ', ' or ');
    }
  };

  static sizeAbvToFull = (abv: any) => {
    if (_.isEmpty(abv)) return 'unknown';
    return Parser._parseAToB(SIZE_ABV_TO_FULL, abv, undefined);
  };

  static dmgTypeToFull = (dmgType = []) => {
    return dmgType.map((dmg) => {
      return DMGTYPE_JSON_TO_FULL[dmg];
    });
  };

  static senseToExplanation = (senseType: any) => {
    senseType = senseType.toLowerCase();
    return Parser._parseAToB(SENSE_JSON_TO_FULL, senseType, ['No explanation available.']);
  };

  static senseToObject = (senses: any = []) => {
    return senses.map((sense: any) => {
      return {
        [sense]: Parser.senseToExplanation(sense.split(' ')[0]),
      };
    });
  };

  static getOfficialSpellClass = (classList: any = []) => {
    if (_.isEmpty(classList)) return [];
    const officials = classList.map((classItem: any) => {
      if (Object.keys(OFFICIAL_SOURCES).includes(classItem.source)) {
        return `{@class ${classItem.name.toLowerCase()}|${classItem.source.toLowerCase()}}`;
      }
    });
    return officials.filter((x: any) => !!x);
  };

  static getOfficialSpellSubclass = (classList: any = []) => {
    if (_.isEmpty(classList)) return [];
    const officials = classList.map((classItem: any) => {
      if (
        Object.keys(OFFICIAL_SOURCES).includes(classItem.class?.source) &&
        Object.keys(OFFICIAL_SOURCES).includes(classItem.subclass?.source)
      ) {
        return (
          `{@subclass ${classItem.subclass.name.toLowerCase()}|${classItem.subclass.source.toLowerCase()}} ` +
          `{@class ${classItem.class.name.toLowerCase()}|${classItem.class.source.toLowerCase()}}`
        );
      }
    });
    return officials.filter((x: any) => !!x);
  };

  static spComponentsToFull = (comp: any, level: any) => {
    if (!comp) return 'None';
    const out: any = [];
    if (comp.v) out.push('V');
    if (comp.s) out.push('S');
    if (comp.m != null) out.push(`M${comp.m !== true ? ` (${comp.m.text != null ? comp.m.text : comp.m})` : ''}`);
    if (comp.r) out.push(`R (${level} gp)`);
    return out || ['None'];
  };

  static spDurationToFull = (dur: any) => {
    let hasSubOr = false;
    const outParts = dur.map((d: any) => {
      switch (d.type) {
        case 'special':
          return 'Special';
        case 'instant':
          return `Instantaneous${d.condition ? ` (${d.condition})` : ''}`;
        case 'timed':
          return `${d.concentration ? 'Concentration, ' : ''}${d.concentration ? 'u' : d.duration.upTo ? 'U' : ''}${
            d.concentration || d.duration.upTo ? 'p to ' : ''
          }${d.duration.amount} ${d.duration.amount === 1 ? d.duration.type : `${d.duration.type}s`}`;
        case 'permanent': {
          if (d.ends) {
            const endsToJoin = d.ends.map((m: any) => Parser._parseAToB(SP_END_TYPE_TO_FULL, m));
            hasSubOr = hasSubOr || endsToJoin.length > 1;
            return `Until ${endsToJoin.joinConjunct(', ', ' or ')}`;
          } else {
            return 'Permanent';
          }
        }
      }
    });
    return `${outParts.joinConjunct(hasSubOr ? '; ' : ', ', ' or ')}${dur.length > 1 ? ' (see below)' : ''}`;
  };

  static spTime = (time: any) => {
    const text = time.map((timeItem: any) => {
      return {
        full: `${timeItem.number} ${
          !_.isEmpty(timeItem.unit) ? Parser._parseAToB(SP_TIME_TO_FULL, timeItem.unit) : ''
        }`,
        short: `${timeItem.number} ${
          !_.isEmpty(timeItem.unit) ? Parser._parseAToB(SP_TIME_TO_ABV, timeItem.unit) : ''
        }`,
      };
    });
    return {
      text,
      details: time,
    };
  };

  static spRange = (range: any) => {
    return range;
  };

  static spSchool = (school: any) => {
    return Parser._parseAToB(SP_SCHOOL_ABV_TO_FULL, school);
  };

  static spSubschools = (subschools = []) => {
    return subschools
      .map((school) => {
        return Parser._parseAToB(SP_SCHOOL_ABV_TO_FULL, school);
      })
      .filter((x) => !!x);
  };
}

export { Parser };
