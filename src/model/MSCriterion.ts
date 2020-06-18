import Section from "./Section";
import {Criterion} from "./Criterion";
import Log from "../Util";
import {Data} from "./Data";

export class MSCriterion extends Criterion {
    protected filter: string;

    private key: string;
    private value: string | number;

    constructor(comparator: string, obj: any) {
        super(comparator, obj);
        this.filter = comparator;

        let keysArray = Object.keys(obj);

        this.key = keysArray[0].split("_")[1];
        this.value = obj[keysArray[0]];
    }

    public matches(data: Data): boolean {
        let secAny = data.returnResultObject("") as any;
        switch (this.filter) {
            case "EQ":
                return secAny[this.key] === this.value;
            case "LT":
                return secAny[this.key] < this.value;
            case "GT":
                return secAny[this.key] > this.value;
            case "IS":
                let val = this.value as string;

                if (val.includes("*")) {
                    if (val.substr(0, 1) === "*" && val.substr(-1) === "*") {
                        return secAny[this.key].includes(val.substr(1, val.length - 2));
                    } else if (val.substr(0, 1) === "*") {
                        let searchString = val.substr(1);
                        let regex = new RegExp("^.*" + searchString + "$");
                        return secAny[this.key].match(regex);
                    } else {
                        let searchString = val.substr(0, val.length - 1);
                        let regex = new RegExp("^" + searchString + ".*$");
                        return secAny[this.key].match(regex);
                    }
                }
                return secAny[this.key] === this.value;
            default:
                return false;
        }
    }
}
