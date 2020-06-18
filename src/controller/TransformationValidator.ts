import {InsightError} from "./IInsightFacade";
import {APPLYTOKEN, KEY_TYPE, QueryValidator} from "./QueryValidator";

export function validateTransformations(query: any, qv: QueryValidator): void {

    let transformationKeys = qv.getTransKeys();

    let keys = Object.keys(query);

    if (keys.length > 2) {
        throw new InsightError("Excess keys in TRANSFORMATIONS");
    }

    if (!keys.includes("GROUP")) {
        throw new InsightError("Missing GROUP in TRANSFORMATIONS");
    }

    if (!keys.includes("APPLY")) {
        throw new InsightError("Missing APPLY in TRANSFORMATIONS");
    }

    let group = query["GROUP"];

    if (!Array.isArray(group)) {
        throw new InsightError("GROUP must be an array");
    }

    if (group.length === 0) {
        throw new InsightError("GROUP must be a non-empty array");
    }

    for (let groupKey of group) {
        qv.validateKey(groupKey, KEY_TYPE.BOTH);
        transformationKeys.add(groupKey);
    }

    let apply = query["APPLY"];

    if (!Array.isArray(apply)) {
        throw new InsightError("APPLY must be an array");
    }

    if (apply.length > 0) {
        validateApplyRules(apply, transformationKeys, qv);
    }
}

function validateApplyRules(apply: any, transformationKeys: any, qv: QueryValidator) {
    for (let applyRules of apply) {

        if (typeof applyRules !== "object" || applyRules === null) {
            throw new InsightError("APPLYRULES must be an object");
        }

        let applyKeyArray = Object.keys(applyRules);
        if (applyKeyArray.length !== 1) {
            throw new InsightError("Apply rule should have exactly 1 key");
        }

        let applyKey = applyKeyArray[0];
        if (typeof applyKey !== "string") {
            throw new InsightError("applykey must be string");
        }

        if (applyKey.includes("_")) {
            throw new InsightError("Cannot contain underscore in applyKey");
        }
        if (applyKey === "") {
            throw new InsightError("Apply key cannot be empty string");
        }

        if (transformationKeys.has(applyKey)) {
            throw new InsightError("Duplicate APPLY key " + applyKey);
        }

        transformationKeys.add(applyKey);
        let applyRuleBody = applyRules[applyKey];

        if (typeof applyRuleBody !== "object" || applyRuleBody === null) {
            throw new InsightError("Apply body must be an object");
        }
        let applyTokenArray = Object.keys(applyRuleBody);
        let applyToken = applyTokenArray[0];

        if (!APPLYTOKEN.has(applyToken)) {
            throw new InsightError("Invalid transformation operator");
        }

        let targetKey = applyRuleBody[applyToken];
        qv.validateKey(targetKey, KEY_TYPE.BOTH);
        let targetKeySplit = targetKey.split("_")[1];

        if (applyToken !== "COUNT" && qv.isSField(targetKeySplit)) {
            throw new InsightError("Invalid key type in " + applyToken);
        }
    }
}


