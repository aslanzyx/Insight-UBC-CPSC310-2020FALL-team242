import { InsightError } from "../controller/IInsightFacade";


export default class QueryValidator {
    private static validCoursesMFields = ["avg", "pass", "fail", "audit", "year"];
    private static validCoursesSFields = ["dept", "id", "instructor", "title", "uuid"];
    private static validRoomsMFieds = ["lat", "lon", "seats"];
    private static validRoomsSFieds =
        ["fullname", "shortname", "number", "name", "address", "type", "furniture", "href"];

    private static DIRECTION = ["UP", "DOWN"];
    private static APPLYTOKEN = ["MAX", "MIN", "AVG", "COUNT", "SUM"];
    private static ORDERKeys = ["dir", "keys"];
    private static QueryKeys = ["WHERE", "OPTIONS", "TRANSFORMATIONS"];
    private static OPTIONSKeys = ["COLUMNS", "ORDER"];

    private query: any;
    private id: string;
    private applyKeys: string[];
    private transformed: boolean;

    constructor(query: any, id: string) {
        this.query = query;
        this.id = id;
        this.applyKeys = [];
        this.transformed = false;
    }

    private isNullOrUndefined(obj: any) {
        return obj === null || obj === undefined;
    }

    private checkQuerySyntax() {
        if (typeof this.query !== "object") {
            throw new InsightError("Query should be a JSON object!");
        }
        if (this.isNullOrUndefined(this.query)) {
            throw new InsightError("Query should not be null or undefined!");
        }
        if (this.query.length !== undefined) {
            throw new InsightError("Query should not be an array!");
        }
        if (!Object.keys(this.query).includes(QueryValidator.QueryKeys[0])) {
            throw new InsightError("Query is missing WHERE!");
        }
        if (!Object.keys(this.query).includes(QueryValidator.QueryKeys[1])) {
            throw new InsightError("Query is missing OPTIONS!");
        }
    }

    public validateQuery() {
        this.checkQuerySyntax();
        // Validate where
        let whereObj = this.query["WHERE"];
        if (typeof whereObj !== "object") {
            throw new InsightError("WHERE should be a JSON object");
        }
        if (whereObj === null || whereObj === undefined) {
            throw new InsightError("WHERE cannot be null or undefined!");
        }
        let len = Object.keys(whereObj).length;
        if (len > 1) {
            throw new InsightError("WHERE cannot have more than one key!");
        }
        this.validKey(whereObj);
        if (Object.keys(this.query).includes(QueryValidator.QueryKeys[2])) {
            this.transformed = true;
            this.validateTRANSFORMATIONS(this.query);
        }
        this.validateOPTIONS(this.query[QueryValidator.QueryKeys[1]]);
    }

    private validateOPTIONS(options: any) {
        let optionsKeys = Object.keys(options);
        // Check COLUMNS exist
        optionsKeys.forEach((key: string) => {
            if (!QueryValidator.OPTIONSKeys.includes(key)) {
                throw new InsightError("OPTIONS can only have COLUMNS and ORDER!");
            }
        });
        if (!optionsKeys.includes("COLUMNS") || options["COLUMNS"].length === 0) {
            throw new InsightError("COLUMNS should exist and be nonempty!");
        }
        // Validate fields in COLUMNS
        let columnsKeys = options["COLUMNS"];
        columnsKeys.forEach((field: string) => {
            if (this.transformed) {
                if (!this.applyKeys.includes(field)) {
                    throw new InsightError("Invalid fields in apply keys!");
                }
            } else {
                let parts = field.split("_");
                if (parts.length > 2) {
                    throw new InsightError("Multiple underscores!");
                }
                if (parts[0] !== this.id) {
                    throw new InsightError("Dataset id not match in COLUMN!");
                }
                this.validField(parts[1]);
            }
        });
        // Validate ORDER
        if (optionsKeys.includes("ORDER")) {
            this.validORDER(options["ORDER"], columnsKeys);
        }
    }

    private validField(field: string) {
        if (this.id === "courses" &&
            !QueryValidator.validCoursesMFields.includes(field) &&
            !QueryValidator.validCoursesSFields.includes(field)) {
            throw new InsightError("Invalid fields!");
        }
        if (this.id === "rooms" &&
            !QueryValidator.validRoomsMFieds.includes(field) &&
            !QueryValidator.validRoomsSFieds.includes(field)) {
            throw new InsightError("Invalid fields!");
        }
    }

    // all good
    private validORDER(orderObj: any, columnsKeys: string[]) {
        if (orderObj === null || orderObj === undefined) {
            throw new InsightError("ORDER key cannot be null or undefined!");
        }
        if (typeof orderObj !== "string") {
            this.validComplexOrder(orderObj, columnsKeys);
        } else {
            this.validOrderKeys([orderObj], columnsKeys);
        }
    }

    // all good
    private validComplexOrder(orderObj: any, columnsKeys: string[]) {
        let keys = Object.keys(orderObj);
        if (keys[0] !== QueryValidator.ORDERKeys[0]) {
            throw new InsightError("Complex ORDER should have 1st key as dir");
        }
        if (keys[1] !== QueryValidator.ORDERKeys[1]) {
            throw new InsightError("Complex ORDER should have 2st key as dir");
        }
        if (keys.length !== 2) {
            throw new InsightError("Complex ORDER should have exactly 2 keys");
        }
        if (orderObj[QueryValidator.ORDERKeys[1]].length === undefined) {
            throw new InsightError("keys must be an array");
        }
        this.validDirection(orderObj[QueryValidator.ORDERKeys[0]]);
        this.validOrderKeys(orderObj[QueryValidator.ORDERKeys[1]], columnsKeys);
    }

    // all good
    private validDirection(dir: string) {
        if (!QueryValidator.DIRECTION.includes(dir)) {
            throw new InsightError("Invalid DIRECTION");
        }
    }

    // all good
    private validOrderKeys(keys: string[], columnsKeys: string[]) {
        keys.forEach((key: string) => {
            if (!columnsKeys.includes(key)) {
                throw new InsightError("ORDER key should be in COLUMNS!");
            }
        });
    }

    private validKey(obj: any) {
        let filter = Object.keys(obj)[0];
        if (["LT", "EQ", "GT", "IS"].includes(filter)) {
            this.validMS(obj, filter);
        } else if (["AND", "OR"].includes(filter)) {
            this.validANDOR(obj, filter);
        } else if (filter === "NOT") {
            this.validNOT(obj, filter);
        }
    }

    private validMS(obj: any, filter: string) {
        if (Object.keys(obj[filter]).length !== 1) {
            throw new InsightError("Filter should have only one key!");
        }
        let key = Object.keys(obj[filter])[0];
        let parts = key.split("_");
        if (parts.length > 2) {
            throw new InsightError("Too many underscores!");
        }
        if (parts[0] !== this.id) {
            throw new InsightError("Invalid dataset id");
        }
        if (["LT", "EQ", "GT"].includes(filter)) {
            if (typeof obj[filter][key] !== "number") {
                throw new InsightError("Field type should be number!");
            }
            if (!QueryValidator.validCoursesMFields.includes(parts[1]) &&
                !QueryValidator.validRoomsMFieds.includes(parts[1])) {
                throw new InsightError("invalid key/type of MC");
            }
        } else {
            if (typeof obj[filter][key] !== "string") {
                throw new InsightError("Field type should be string!");
            }
            if (!QueryValidator.validCoursesSFields.includes(parts[1]) &&
                !QueryValidator.validRoomsSFieds.includes(parts[1])) {
                throw new InsightError("invalid key/type of IS");
            }
        }
    }

    private validANDOR(obj: any, filter: string) {
        let objs = obj[filter];  // this is a list of objects!
        if (!Array.isArray(objs)) {
            throw new InsightError("AND/OR Should be an array!");
        }
        if (objs.length === 0) {
            throw new InsightError("AND/OR Should have at least one object!");
        }
        for (let i in objs) {
            let objSub = objs[i];
            if (Object.keys(objSub).length !== 1) {
                throw new InsightError("Objects in AND/OR should have only one key!");
            }
            this.validKey(objSub);  // recursion
        }
    }

    private validNOT(obj: any, filter: string) {
        let objSub = obj[filter];
        let length = Object.keys(obj[filter]).length;
        if (length === 0) {
            throw new InsightError("NOT should not have no key!");
        }
        if (length > 1) {
            throw new InsightError("NOT should not have more than one key!");
        }
        this.validKey(objSub);
    }

    private validateTRANSFORMATIONS(query: any) {

        let transformationsObj = query["TRANSFORMATIONS"];
        let transformationsKeys = Object.keys(transformationsObj);
        // Check if any invalid keys exist
        transformationsKeys.forEach((key: string) => {
            if (!["GROUP", "APPLY"].includes(key)) {
                throw new InsightError("OPTIONS can only have GROUP and APPLY!");
            }
        });
        // Check GROUP exist
        if (!transformationsKeys.includes("GROUP") || transformationsObj["GROUP"].length === 0) {
            throw new InsightError("GROUP should exist and be nonempty!");
        }
        // Validate fields in GROUP
        let groupKeys = transformationsObj["GROUP"];
        groupKeys.forEach((field: string) => {
            let parts = field.split("_");
            if (parts.length > 2) {
                throw new InsightError("Multiple underscores!");
            }
            if (parts[0] !== this.id) {
                throw new InsightError("Dataset id not match!");
            }
            this.validField(parts[1]);
            this.applyKeys.push(field);
        });

        this.validAPPLY(transformationsObj["APPLY"]);
    }

    private validAPPLY(applyRules: any[]) {
        applyRules.forEach((applyRule: any) => {
            let ruleKeys = Object.keys(applyRule);
            if (ruleKeys.length !== 1) {
                throw new InsightError("Should have only one apply key in one apply rule");
            }
            let applyTokens = Object.keys(applyRule[ruleKeys[0]]);
            if (applyTokens.length !== 1) {
                throw new InsightError("Should have only one apply token in one apply rule");
            }
            if (!QueryValidator.APPLYTOKEN.includes(applyTokens[0])) {
                throw new InsightError("Invalid apply token");
            }
            let ruleField = applyRule[ruleKeys[0]][applyTokens[0]].split("_")[1];
            this.validField(ruleField);
            if ((QueryValidator.validCoursesSFields.includes(ruleField) ||
                QueryValidator.validRoomsSFieds.includes(ruleField)) &&
                applyTokens[0] !== "COUNT") {
                throw new InsightError("Invalid apply field to numerical applyrule!");
            }
            if (this.applyKeys.includes(ruleKeys[0])) {
                throw new InsightError("Duplicated rule keys!");
            }
            this.applyKeys.push(ruleKeys[0]);
        });
    }
}
