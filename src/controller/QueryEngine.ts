import {InsightError, ResultTooLargeError} from "./IInsightFacade";
import DatasetManager from "./DatasetManager";
import {MCOMPARATOR, MFIELDS_COURSES, MFIELDS_ROOMS, QueryValidator} from "./QueryValidator";
import {Criterion} from "../model/Criterion";
import {buildCriterion} from "./CriterionManager";
import Dataset from "../model/Dataset";
import {Data} from "../model/Data";
import Decimal from "decimal.js";

export default class QueryEngine {

    private readonly RESULTS_COUNT_LIMIT = 5000;

    private columns: string[];
    private order: any;
    private criterion: Criterion;

    private datasetManager: DatasetManager;
    private datasetToQuery: string;

    constructor(datasetManager: DatasetManager) {
        this.datasetManager = datasetManager;
        this.columns = [];
        this.order = undefined;
        this.criterion = undefined;
    }

    public performQuery(query: any): Promise<any[]> {
        return new Promise((resolve, reject) => {

            if (typeof query !== "object" || query === null || Array.isArray(query)) {
                throw new InsightError("Invalid query");
            }

            let queryValidator = new QueryValidator(query, this.datasetManager.getDatasetIDs(), this.datasetManager);
            this.datasetToQuery = queryValidator.validateQuery();

            let where = query["WHERE"];

            let options = query["OPTIONS"];
            let columns = options["COLUMNS"];

            for (let column of columns) {
                this.columns.push(column);
            }

            if (Object.keys(where).length > 0) {
                this.criterion = buildCriterion(query["WHERE"]);
            }

            let dataset = this.datasetManager.getDataSet(this.datasetToQuery);

            let result = this.getRowsThatMatchCriterion(dataset);

            let transformations = query["TRANSFORMATIONS"];
            if (transformations !== undefined) {
                result = this.transformQuery(result, transformations);
            } else {
                if (result.length > this.RESULTS_COUNT_LIMIT) {
                    throw new ResultTooLargeError("Result too large");
                }

                this.filterSelect(result);
            }

            if (options["ORDER"] !== undefined) {
                this.order = options["ORDER"];
                this.sortResults(result);
            }

            resolve(result);
        });
    }

    private filterSelect(result: any[]): void {
        for (let row of result) {
            let keys = Object.keys(row);

            for (let key of keys) {
                if (!this.columns.includes(key)) {
                    delete row[key];
                }
            }
        }
    }

    private getRowsThatMatchCriterion(dataset: Dataset): any[] {
        let result: any[] = [];
        let data: Data[] = dataset.getData() as Data[];

        for (let row of data) {
            if (this.criterion === undefined || this.criterion.matches(row)) {
                result.push(row.returnResultObject(this.datasetToQuery));
            }
        }
        return result;
    }

    private transformQuery(results: any[], transformations: any): any[] {
        let group = transformations["GROUP"];
        let distinctGroups: Map<string, any[]> = new Map();

        for (let row of results) {
            let mapKey: any[] = [];

            for (let key of group) {
                mapKey.push(row[key]);
            }

            let keyString = JSON.stringify(mapKey);

            if (!distinctGroups.has(keyString)) {
                distinctGroups.set(keyString, []);
            }
            distinctGroups.get(keyString).push(row);
        }

        let apply = transformations["APPLY"];
        return this.applyTransformations(distinctGroups, apply, group);
    }

    private applyTransformations(groupMap: Map<string, any[]>, applyRules: any[], groupKeys: string[]): any[] {
        let transformMap: Map<string, any[]> = new Map<string, any[]>();
        for (let applyRule of applyRules) {

            let applyKey = Object.keys(applyRule)[0];
            let applyBody = applyRule[applyKey];

            groupMap.forEach((value, key, map) => {
                let transformedGroup = this.applyToken(applyKey, applyBody, map.get(key));

                if (!transformMap.has(key)) {
                    transformMap.set(key, []);
                }

                transformMap.get(key).push(transformedGroup);
            });
        }

        return (applyRules.length > 0 ? this.parseTransformations(transformMap, groupKeys, false) :
            this.parseTransformations(groupMap, groupKeys, true));
    }

    private parseTransformations(tMap: Map<string, any[]>, groupKeys: string[], emptyApply: boolean): any[] {
        let transformedGroups: any[] = [];

        tMap.forEach((value, key, map) => {

            if (transformedGroups.length > this.RESULTS_COUNT_LIMIT) {
                throw new ResultTooLargeError("Result too large");
            }

            let keyArray: any[] = JSON.parse(key);

            let obj: any = {};

            for (let i = 0; i < groupKeys.length; i++) {
                let groupKey = groupKeys[i];
                let keyValue = keyArray[i];

                if (this.columns.includes(groupKey)) {
                    obj[groupKey] = keyValue;
                }
            }

            if (!emptyApply) {
                for (let transformation of value) {
                    let applyKey = Object.keys(transformation)[0];

                    if (this.columns.includes(applyKey)) {
                        obj[applyKey] = transformation[applyKey];
                    }
                }
            }

            transformedGroups.push(obj);
        });

        return transformedGroups;
    }

    private applyToken(applyKey: string, applyBody: any, group: any[]): any {
        let applyToken = Object.keys(applyBody)[0];
        let key = applyBody[applyToken];

        let acc = (applyToken === "MIN" ? Number.MAX_SAFE_INTEGER : applyToken === "MAX" ? Number.MIN_SAFE_INTEGER
            : 0);
        let avgAcc = new Decimal(0);

        let keySet: Set<string> = new Set();

        for (let obj of group) {
            switch (applyToken) {
                case "MAX":
                    if (obj[key] > acc) {
                        acc = obj[key];
                    }
                    break;
                case "MIN":
                    if (obj[key] < acc) {
                        acc = obj[key];
                    }
                    break;
                case "AVG":
                    let decVal = new Decimal(obj[key]);
                    avgAcc = Decimal.add(decVal, avgAcc);
                    break;
                case "COUNT":
                    if (!keySet.has(obj[key])) {
                        keySet.add(obj[key]);
                        acc++;
                    }
                    break;
                case "SUM":
                    acc += obj[key];
                    break;
            }
        }
        if (applyToken === "AVG") {
            acc = avgAcc.toNumber() / group.length;
        }

        if (applyToken === "AVG" || applyToken === "SUM") {
            acc = Number(acc.toFixed(2));
        }
        return {[applyKey]: acc};
    }

    private sortResults(result: any[]): void {
        if (typeof this.order === "string") {
            result.sort((a, b) => {

                let aValue: string | number = a[this.order];
                let bValue: string | number = b[this.order];

                if (aValue > bValue) {
                    return 1;
                } else if (aValue < bValue) {
                    return -1;
                } else {
                    return 0;
                }
            });
        } else {
            let dir = this.order["dir"];
            let keys = this.order["keys"];

            result.sort((a, b) => {
                if (dir === "UP") {
                    return this.sortUp(keys, a, b);
                } else {
                    return this.sortDown(keys, a, b);
                }
            });
        }
    }

    private sortUp(keys: string[], a: any, b: any): number {
        for (let key of keys) {
            let aValue: string | number = a[key];
            let bValue: string | number = b[key];

            if (aValue > bValue) {
                return 1;
            } else if (aValue < bValue) {
                return -1;
            }
        }

        return 0;
    }

    private sortDown(keys: string[], a: any, b: any): number {
        for (let key of keys) {
            let aValue: string | number = a[key];
            let bValue: string | number = b[key];

            if (aValue > bValue) {
                return -1;
            } else if (aValue < bValue) {
                return 1;
            }
        }

        return 0;
    }
}
