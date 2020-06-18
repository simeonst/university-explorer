import {LOGIC_COMPARATORS, MCOMPARATOR, SCOMPARATOR} from "./QueryValidator";
import {Criterion} from "../model/Criterion";
import {NegationCriterion} from "../model/NegationCriterion";
import {MSCriterion} from "../model/MSCriterion";
import {LogicCriterion} from "../model/LogicCriterion";

export function buildCriterion(obj: any): Criterion {
    let key = Object.keys(obj)[0];
    let type = determineCriterionType(key);

    switch (type) {
        case "LogicCriterion":
            return new LogicCriterion(key, obj[key]);
        case "MSCriterion":
            return new MSCriterion(key, obj[key]);
        default:
            return new NegationCriterion("NOT", obj[key]);
    }
}

function determineCriterionType(key: string): string {
    if (LOGIC_COMPARATORS.has(key)) {
        return "LogicCriterion";
    } else if (MCOMPARATOR.has(key) || SCOMPARATOR.has(key)) {
        return "MSCriterion";
    } else {
        return "NegationCriterion";
    }
}
