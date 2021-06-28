import './utils';
declare class Parser {
    static _parseAToB: (abMap: any, a: any, fallback?: any) => any;
    static _parseBToA: (abMap: any, b: any) => any;
    static _addCommas: (intNum: string) => string;
    static getFullSource: (source: any) => any;
    static getCreatureType: (creatureType: any) => any;
    static getSpeedString: (it: any) => any;
    static alignmentAbvToFull: (alignment: any) => any;
    static acToFull: (ac: any) => string;
    static miscTagsToFull: (tags?: never[]) => never[];
    static crToNumber: (cr: any) => number;
    static crToXp: (cr: any, { isDouble }?: {
        isDouble?: boolean | undefined;
    }) => string;
    static monCrToFull: (cr: any, { xp, isMythic }?: {
        xp?: string | undefined;
        isMythic?: boolean | undefined;
    }) => any;
    static sizeAbvToFull: (abv: any) => any;
    static dmgTypeToFull: (dmgType?: never[]) => any[];
    static senseToExplanation: (senseType: any) => any;
    static senseToObject: (senses?: any) => any;
    static getOfficialSpellClass: (classList?: any) => any;
    static getOfficialSpellSubclass: (classList?: any) => any;
    static spComponentsToFull: (comp: any, level: any) => any;
    static spDurationToFull: (dur: any) => string;
    static spTime: (time: any) => {
        text: any;
        details: any;
    };
    static spRange: (range: any) => any;
    static spSchool: (school: any) => any;
    static spSubschools: (subschools?: never[]) => any[];
}
export { Parser };
