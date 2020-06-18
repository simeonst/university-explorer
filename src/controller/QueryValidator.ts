import {InsightDatasetKind, InsightError} from "./IInsightFacade";
import DatasetManager from "./DatasetManager";
import {validateTransformations} from "./TransformationValidator";
import {validateOptions} from "./OptionsValidator";
import {validateFilter} from "./FilterValidator";

export enum KEY_TYPE {MKEY = "mkey", SKEY = "skey", BOTH = "both"}

export const LOGIC_COMPARATORS = new Set(["AND", "OR"]);
export const MCOMPARATOR = new Set(["LT", "GT", "EQ"]);
export const SCOMPARATOR = new Set(["IS"]);

export const MFIELDS_COURSES = new Set(["avg", "pass", "fail", "audit", "year"]);
export const MFIELDS_ROOMS = new Set(["lat", "lon", "seats"]);
export const SFIELDS_COURSES = new Set(["dept", "id", "instructor", "title", "uuid"]);
export const SFIELDS_ROOMS = new Set(["fullname", "shortname", "number", "name", "address", "type",
    "furniture", "href"]);
export const DIRECTION = new Set(["UP", "DOWN"]);
export const APPLYTOKEN = new Set(["MAX", "MIN", "AVG", "COUNT", "SUM"]);

export class QueryValidator {

    private datasetIDToQuery: string;
    private datasetIDs: string[];
    private query: any;
    private transformationKeys: Set<string>;
    private MFIELDS: Set<string>;
    private SFIELDS: Set<string>;
    private datasetManager: DatasetManager;

    constructor(query: any, datasetIDs: string[], datasetM: DatasetManager) {
        this.datasetIDToQuery = null;
        this.query = query;
        this.datasetIDs = datasetIDs;
        this.transformationKeys = new Set();
        this.MFIELDS = new Set();
        this.SFIELDS = new Set();
        this.datasetManager = datasetM;
    }

    // Validates the query. If it passes, return the ID of the dataset to query.
    public validateQuery(): string {
        this.validateTopLevel();
        validateOptions(this.query["OPTIONS"], this);
        validateFilter(this.query["WHERE"], "WHERE", this);

        return this.datasetIDToQuery;
    }

    private validateTopLevel(): void {
        let keys = Object.keys(this.query);

        if (keys.length > 3) {
            throw new InsightError("Excess keys in query");
        }
        if (!keys.includes("WHERE")) {
            throw new InsightError("Missing WHERE");
        }
        if (!keys.includes("OPTIONS")) {
            throw new InsightError("Missing OPTIONS");
        }

        if (typeof this.query["WHERE"] !== "object") {
            throw new InsightError("WHERE must be an object");
        }
        if (typeof this.query["OPTIONS"] !== "object" || this.query["OPTIONS"] === null) {
            throw new InsightError("OPTIONS must be an object");
        }

        if (keys.length === 3) {
            if (!keys.includes("TRANSFORMATIONS")) {
                throw new InsightError("Missing TRANSFORMATIONS");
            }

            if (typeof this.query["TRANSFORMATIONS"] !== "object") {
                throw new InsightError("TRANSFORMATIONS must be an object");
            }

            if (this.query["TRANSFORMATIONS"] === null || this.query["TRANSFORMATIONS"] === undefined) {
                throw new InsightError("TRANSFORMATIONS cannot be null or undefined");
            }

            validateTransformations(this.query["TRANSFORMATIONS"], this);
        }
    }

    public validateKey(key: string, type: KEY_TYPE): void {
        if (typeof key !== "string") {
            throw new InsightError("Expected key to be a string, but got an " + typeof key + " instead");
        }
        let array = key.split("_");
        if (array.length !== 2) {
            throw new InsightError("Invalid key: " + key);
        }

        if (!DatasetManager.validateID(array[0])) {
            throw new InsightError("Invalid ID: " + array[0]);
        }

        if (this.datasetIDToQuery === null) {
            if (!this.datasetIDs.includes(array[0])) {
                throw new InsightError("Attempted to query nonexistent dataset");
            }
            this.datasetIDToQuery = array[0];
            let dataset = this.datasetManager.getDataSet(this.datasetIDToQuery);

            if (dataset.getDatasetKind() === InsightDatasetKind.Courses) {
                this.MFIELDS = MFIELDS_COURSES;
                this.SFIELDS = SFIELDS_COURSES;
            } else {
                this.MFIELDS = MFIELDS_ROOMS;
                this.SFIELDS = SFIELDS_ROOMS;
            }
        } else {
            if (this.datasetIDToQuery !== array[0]) {
                throw new InsightError("Can't query more than one dataset");
            }
        }
        switch (type) {
            case KEY_TYPE.BOTH:
                if (!(this.isMField(array[1]) || this.isSField(array[1]))) {
                    throw new InsightError("Invalid key (neither MKey nor SKey), key: " + key);
                }
                break;
            case KEY_TYPE.MKEY:
                if (!this.isMField(array[1])) {
                    throw new InsightError("Invalid MKey: " + key);
                }
                break;
            case KEY_TYPE.SKEY:
                if (!this.isSField(array[1])) {
                    throw new InsightError("Invalid SKey: " + key);
                }
                break;
        }
    }

    public validateMComparator(comparator: any, comparatorName: string) {
        if (typeof comparator !== "object" || comparator == null || Array.isArray(comparator)) {
            throw new InsightError("MComparator " + comparatorName + " is not an object");
        }

        let keys = Object.keys(comparator);

        if (keys.length !== 1) {
            throw new InsightError("Invalid number of arguments for " + comparatorName);
        }

        let key = keys[0];

        this.validateKey(key, KEY_TYPE.MKEY);

        if (typeof comparator[key] !== "number") {
            throw new InsightError("Invalid argument type in " + comparatorName + "; should be number");
        }
    }

    public validateSComparator(comparator: any, comparatorName: string) {
        if (typeof comparator !== "object" || comparator == null || Array.isArray(comparator)) {
            throw new InsightError("SComparator " + comparatorName + " is not an object");
        }

        let keys = Object.keys(comparator);

        if (keys.length !== 1) {
            throw new InsightError("Invalid number of arguments for " + comparatorName);
        }

        let key = keys[0];

        this.validateKey(key, KEY_TYPE.SKEY);

        let value = comparator[key];

        if (typeof value !== "string") {
            throw new InsightError("Invalid argument type in " + comparatorName + "; should be string");
        }

        // Regular expression checks for the presence of zero or one asterisks
        // at the start/end of the string (\\*?), and any character but an asterisk in the middle ([^*]*).
        // Matches whole string (^ at start and $ at end)
        let regexp = new RegExp("^\\*?[^*]*\\*?$");

        if (!value.match(regexp)) {
            throw new InsightError("Invalid string: Asterisk can only be first/last character of string");
        }
    }

    public validateLogicComparator(comparator: any, comparatorName: string) {
        if (!Array.isArray(comparator)) {
            throw new InsightError("Invalid type of LOGIC_COMPARATOR " + comparatorName + ": expected array");
        }

        if (comparator.length < 1) {
            throw new InsightError(comparatorName + " must be a non-empty array");
        }

        for (let filter of comparator) {
            validateFilter(filter, comparatorName, this);
        }
    }

    public validateNegation(negation: any) {
        if (typeof negation !== "object" || negation == null || Array.isArray(negation)) {
            throw new InsightError("Invalid type in NOT, expected object");
        }

        validateFilter(negation, "NOT", this);
    }

    public isMField(key: string): boolean {
        return this.MFIELDS.has(key);
    }

    public isSField(key: string): boolean {
        return this.SFIELDS.has(key);
    }

    public getTransKeys(): Set<string> {
        return this.transformationKeys;
    }
}
