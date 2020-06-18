import Section from "./Section";
import {Data} from "./Data";

export abstract class Criterion {

    protected filter: string;

    protected constructor(filter: string, obj: any) {
        this.filter = filter;
    }

    public abstract matches(data: Data): boolean;
}
