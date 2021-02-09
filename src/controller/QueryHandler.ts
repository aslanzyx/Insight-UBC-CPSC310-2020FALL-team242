import { InsightError, ResultTooLargeError } from "../controller/IInsightFacade";
import QueryValidator from "./QueryValidator";
import { Decimal } from "decimal.js";
import * as http from "http";
import Log from "../Util";


export default class QueryHandler {
    private datasets: { [id: string]: object[] };
    private query: any;
    private results: any[];
    private id: any;
    private transformed: boolean;

    constructor(datasets: any, query: any) {
        this.datasets = datasets;
        this.query = query;
        this.transformed = false;
    }

    public runQuery(): Promise<any[]> {
        try {
            this.id = this.getAndValidateID();
            let queryValidator = new QueryValidator(this.query, this.id);
            queryValidator.validateQuery();
            this.results = this.parseWHERE();
            this.parseTRANSFORMATIONS();
            // Check if the results are too large
            if (this.results.length > 5000) {
                return Promise.reject(new ResultTooLargeError("result too long"));
            }
            this.parseOPTIONS();
            return Promise.resolve(this.results);
        } catch (e) {
            return Promise.reject(new InsightError(e.message));
        }
    }

    public getAndValidateID() {
        let possibleIDs = new Set();
        this.query["OPTIONS"]["COLUMNS"].forEach((key: string) => {
            if (key.includes("_")) {
                let parts = key.split("_");
                if (!this.datasets.hasOwnProperty(parts[0])) {
                    throw new InsightError("Nonexist id!");
                }
                possibleIDs.add(parts[0]);
            }
        });
        if (possibleIDs.size > 1) {
            throw new InsightError("Should only query one dataset!");
        }
        if (possibleIDs.size === 0) {
            throw new InsightError("Cannot get dataset id!");
        }
        return Array.from(possibleIDs)[0];
    }

    private parseWHERE() {
        if (Object.keys(this.query["WHERE"]).length === 0) {  // get everything in the dataset
            return this.datasets[this.id];   // [course sections]
        }
        if (Object.keys(this.query["WHERE"]).length > 1) {
            throw new InsightError("WHERE should have only one key!");
        }
        let whereObj = this.query["WHERE"];
        return this.datasets[this.id].filter((section: object) => {
            return this.parseKey(whereObj, section);
        });
    }

    public parseKey(obj: object, section: object) {
        let key = Object.keys(obj)[0];
        switch (key) {
            case "IS":
                return this.parseSComparison(obj, section);
            case "NOT":
                return this.parseNegation(obj, section);
            case "AND":
                return this.parseLComparison(obj, section, "AND");
            case "OR":
                return this.parseLComparison(obj, section, "OR");
            case "LT":
                return this.parseMComparison(obj, section, "LT");
            case "EQ":
                return this.parseMComparison(obj, section, "EQ");
            case "GT":
                return this.parseMComparison(obj, section, "GT");
            default:
                throw new InsightError("Filter key is invalid!");
        }
    }

    private parseSComparison(obj: any, section: any): boolean {
        let key = Object.keys(obj["IS"])[0];
        let value: string = obj["IS"][key];
        let len = value.length;
        // Check for wildcards
        if (value.split("*").length > 3) {
            throw new InsightError("Should have less than two asterisks!");
        }
        if (value === "*" || value === "**") {
            return true;
        } else if (value.startsWith("*") && value.endsWith("*")) {
            return section[key].includes(value.substring(1, len - 1));
        } else if (value.startsWith("*")) {
            return section[key].endsWith(value.substring(1, len));
        } else if (value.endsWith("*")) {
            return section[key].startsWith(value.substring(0, len - 1));
        } else if (value.includes("*")) {
            throw new InsightError("Asterisk cannot be in the middle of a string!");
        } else {
            return section[key] === value;
        }
    }

    private parseNegation(obj: any, section: any): boolean {
        let objNOT = obj["NOT"];
        return !this.parseKey(objNOT, section);
    }

    private parseLComparison(obj: any, section: any, Logic: string): boolean {
        let objs = obj[Logic];
        if (Logic === "AND") {
            let flag = true;
            for (let i in objs) {
                flag = flag && this.parseKey(objs[i], section);
            }
            return flag;
        } else if (Logic === "OR") {
            let flag = false;
            for (let i in objs) {
                flag = flag || this.parseKey(objs[i], section);
            }
            return flag;
        }
    }

    private parseMComparison(obj: any, section: any, MComparator: string): boolean {
        let key = Object.keys(obj[MComparator])[0];
        let value = obj[MComparator][key];
        switch (MComparator) {
            case "LT":
                return section[key] < value;
            case "EQ":
                return section[key] === value;
            case "GT":
                return section[key] > value;
        }
    }

    public parseOPTIONS() {
        let columns = this.query["OPTIONS"]["COLUMNS"];
        if (columns.length > 0) {
            this.results = this.results.map((section: any) => {
                let res: any = {};
                for (let x of columns) {
                    Log.info(x);
                    Log.info(section[x]);
                    res[x] = section[x];
                }
                return res;
            });
        }
        if (this.query["OPTIONS"].hasOwnProperty("ORDER")) {
            let order = this.query["OPTIONS"]["ORDER"];
            this.parseORDER(order);
        }
    }

    private parseORDER(order: any) {
        if (order !== null) {
            if (typeof order === "string") {
                this.parseSingleOrderKey(order, "UP");
            } else {
                let dir = order["dir"];
                let keys = order["keys"];
                keys.reverse().forEach((key: string) => {
                    this.parseSingleOrderKey(key, dir);
                });
            }
        }
    }

    private parseSingleOrderKey(key: string, dir: string) {
        let inc = 1;
        if (dir === "UP") {
            inc = -1;
        }
        this.results = this.results.sort((a: any, b: any): any => {
            if (a[key] < b[key]) {
                return inc;
            } else if (a[key] === b[key]) {
                return 0;
            } else {
                return -inc;
            }
        });
    }

    private parseTRANSFORMATIONS() {
        if (this.query["TRANSFORMATIONS"] === undefined) {
            return;
        }
        this.transformed = true;
        let groups = this.query["TRANSFORMATIONS"]["GROUP"];
        let results: any[] = [];
        groups = groups.reverse();
        this.parseGROUP(groups, this.results, results);
        this.results = results;

        let apply = this.query["TRANSFORMATIONS"]["APPLY"];
        this.parseAPPLY(apply, groups);
    }

    // tested and working
    private parseGROUP(groups: string[], results: any[], finalResults: any[]) {
        if (groups.length === 0) {
            finalResults.push(results);
            return;
        }
        let field = groups.pop();
        let newResults: any = {};
        results.forEach((section: any) => {
            if (newResults[section[field]] === undefined) {
                newResults[section[field]] = [];
            }
            newResults[section[field]].push(section);
        });

        Object.values(newResults).forEach((r: any[]) => {
            this.parseGROUP(groups, r, finalResults);
        });
        groups.push(field);
    }

    // tested and working
    private parseAPPLY(applyRules: any[], groups: string[]) {
        let results: any[] = [];
        this.results.forEach((r: any[]) => {
            let foldRes: any = this.selectField(groups, r);
            applyRules.forEach((applyRule: any) => {
                this.parseApplyRule(applyRule, r, foldRes);
            });
            results.push(foldRes);
        });
        this.results = results;
    }

    // tested and working
    private parseApplyRule(applyRule: any, partialResult: any[], foldRes: any) {
        let applyKey: string = Object.keys(applyRule)[0];
        let applyToken: string = Object.keys(applyRule[applyKey])[0];
        let applyField: string = applyRule[applyKey][applyToken];
        partialResult = partialResult.map((r: any) => r[applyField]);
        let total = new Decimal(0);
        switch (applyToken) {
            case "MAX":
                foldRes[applyKey] = Math.max(...partialResult);
                break;
            case "MIN":
                foldRes[applyKey] = Math.min(...partialResult);
                break;
            case "AVG":
                partialResult.forEach((r: any) => total = Decimal.add(total, new Decimal(r)));
                let avg = total.toNumber() / partialResult.length;
                foldRes[applyKey] = Number(avg.toFixed(2));
                break;
            case "COUNT":
                foldRes[applyKey] = partialResult.length;
                break;
            case "SUM":
                partialResult.forEach((r: any) => total = Decimal.add(total, new Decimal(r)));
                foldRes[applyKey] = Number(total.toFixed(2));
                break;
            default:
                throw new InsightError("Invalid token");
        }
    }

    // tested and working
    private selectField(groups: string[], partialResult: any[]): any {
        let foldRes: any = {};
        groups.forEach((g: string) => {
            foldRes[g] = partialResult[0][g];
        });
        return foldRes;
    }
}
