import {InsightError} from "./IInsightFacade";
import {DIRECTION, KEY_TYPE, QueryValidator} from "./QueryValidator";

export function validateOptions(query: any, qv: QueryValidator): void {
    let transformationKeys = qv.getTransKeys();

    let keys = Object.keys(query);

    validateQueryStructure(query, keys);

    let columnsArray = query["COLUMNS"];

    if (columnsArray.length === 0) {
        throw new InsightError("COLUMNS must be a non-empty array");
    }

    if (transformationKeys.size === 0) {
        for (let column of columnsArray) {
            qv.validateKey(column, KEY_TYPE.BOTH);
        }
    } else {
        for (let column of columnsArray) {
            if (!transformationKeys.has(column)) {
                throw new InsightError("Invalid key in COLUMN: " + column);
            }
        }
    }

    if (keys.length === 2) {

        if (!keys.includes("ORDER")) {
            throw new InsightError("Missing ORDER");
        }

        if (typeof query["ORDER"] !== "object" && typeof query["ORDER"] !== "string") {
            throw new InsightError("ORDER must be an object or string");
        }

        if (query["ORDER"] === null || query["ORDER"] === undefined) {
            throw new InsightError("ORDER type cannot be null or undefined");
        }

        if (typeof query["ORDER"] === "string") {

            if (!columnsArray.includes(query["ORDER"])) {
                throw new InsightError("Value of ORDER must be in COLUMNS");
            }
        } else if (typeof query["ORDER"] === "object") {
            validateOrder(query, columnsArray);
        }
    }
}

function validateQueryStructure(query: any, keys: any[]) {

    if (keys.length > 2) {
        throw new InsightError("Excess keys in OPTIONS");
    }

    if (!keys.includes("COLUMNS")) {
        throw new InsightError("Missing COLUMNS");
    }

    if (!Array.isArray(query["COLUMNS"])) {
        throw new InsightError("COLUMNS must be an array");
    }
}

function validateOrder(query: any, columnsArray: any) {
    let order = query["ORDER"];
    let orderKeys = Object.keys(order);

    if (orderKeys.length > 2) {
        throw new InsightError("Excess keys in ORDER");
    }

    if (orderKeys.length < 2) {
        throw new InsightError("ORDER needs both dir and keys");
    }

    if (!orderKeys.includes("dir")) {
        throw new InsightError("Missing dir in ORDER");
    }

    if (!orderKeys.includes("keys")) {
        throw new InsightError("Missing keys in ORDER");
    }


    if (typeof order["dir"] !== "string") {
        throw new InsightError("Invalid type in direction");
    }

    if (!DIRECTION.has(order["dir"])) {
        throw new InsightError("Invalid dir in ORDER");
    }

    if (!Array.isArray(order["keys"])) {
        throw new InsightError("keys must be an array");
    }

    let orderKeysArray = order["keys"];

    if (orderKeysArray.length === 0) {
        throw new InsightError("order keys must be a non-empty array");
    }

    for (let orderKey of orderKeysArray) {
        if (!columnsArray.includes(orderKey)) {
            throw new InsightError("ORDER key must be in COLUMNS");
        }
    }
}
