import {Criterion} from "./Criterion";
import Section from "./Section";
import {buildCriterion} from "../controller/CriterionManager";
import {Data} from "./Data";

export class LogicCriterion extends Criterion {

    private criteria: Criterion[];

    constructor(filter: string, obj: any) {
        super(filter, obj);
        this.criteria = [];

        let array = obj as any[];

        for (let criterion of array) {
            this.criteria.push(buildCriterion(criterion));
        }
    }

    public matches(data: Data): boolean {
        if (this.filter === "AND") {
            for (let criterion of this.criteria) {
                if (!criterion.matches(data)) {
                    return false;
                }
            }
            return true;
        } else {
            let match = false;

            for (let criterion of this.criteria) {
                if (criterion.matches(data)) {
                    match = true;
                }
            }

            return match;
        }
    }

}
