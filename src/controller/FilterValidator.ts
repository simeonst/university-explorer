import {InsightError} from "./IInsightFacade";
import {LOGIC_COMPARATORS, MCOMPARATOR, QueryValidator, SCOMPARATOR} from "./QueryValidator";


export function validateFilter(filter: any, filterKey: string, qv: QueryValidator): void {

    if (filter === null) {
        throw new InsightError("Received null filter");
    }

    if (Array.isArray(filter)) {
        throw new InsightError("Filter " + filterKey + " should not be an array.");
    }
    let keys = Object.keys(filter);

    if (keys.length > 1) {
        throw new InsightError("Excess keys in " + filterKey);
    } else if (keys.length === 0) {
        if (filterKey !== "WHERE") {
            throw new InsightError("Zero keys in " + filterKey);
        }
    } else {
        let key = keys[0];

        if (MCOMPARATOR.has(key)) {
            qv.validateMComparator(filter[key], key);
        } else if (SCOMPARATOR.has(key)) {
            qv.validateSComparator(filter[key], key);
        } else if (LOGIC_COMPARATORS.has(key)) {
            qv.validateLogicComparator(filter[key], key);
        } else if (key === "NOT") {
            qv.validateNegation(filter[key]);
        } else {
            throw new InsightError("Invalid key " + key + " in " + filterKey);
        }
    }
}
