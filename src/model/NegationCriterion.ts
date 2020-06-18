import {Criterion} from "./Criterion";
import Section from "./Section";
import {buildCriterion} from "../controller/CriterionManager";
import {Data} from "./Data";

export class NegationCriterion extends Criterion {
    private criterion: Criterion;

    constructor(filter: string, obj: any) {
        super(filter, obj);
        this.criterion = buildCriterion(obj);
    }

    public matches(data: Data): boolean {
        return !this.criterion.matches(data);
    }

}
