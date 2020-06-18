import {Data} from "./Data";

export interface ISection {
    dept: string;
    id: string;
    avg: number;
    instructor: string;
    title: string;
    pass: number;
    fail: number;
    audit: number;
    uuid: string;
    year: number;
}

export function isValidSection(arg: any): arg is ISection {
    return ((arg.id !== undefined) && (typeof arg.id === "string")
        && (arg.dept !== undefined) && (typeof arg.dept === "string")
        && (arg.avg !== undefined) && (typeof arg.avg === "number")
        && (arg.instructor !== undefined) && (typeof arg.instructor === "string")
        && (arg.title !== undefined) && (typeof arg.title === "string")
        && (arg.pass !== undefined) && (typeof arg.pass === "number")
        && (arg.fail !== undefined) && (typeof arg.fail === "number")
        && (arg.audit !== undefined) && (typeof arg.audit === "number")
        && (arg.uuid !== undefined) && (typeof arg.uuid === "string")
        && (arg.year !== undefined) && (typeof arg.year === "number"));
}

export default class Section extends Data {

    public readonly dept: string;
    public readonly id: string;
    public readonly avg: number;
    public readonly instructor: string;
    public readonly title: string;
    public readonly pass: number;
    public readonly fail: number;
    public readonly audit: number;
    public readonly uuid: string;
    public readonly year: number;

    public static constructFromInterface(section: ISection): Section {
        return new Section(section.dept, section.id, section.avg, section.instructor,
            section.title, section.pass, section.fail, section.audit, section.uuid, section.year);
    }

    public returnResultObject(dataset: string): object {
        let obj: any = {};

        if (dataset !== "") {
            obj[dataset + "_dept"] = this.dept;
            obj[dataset + "_id"] = this.id;
            obj[dataset + "_avg"] = this.avg;
            obj[dataset + "_instructor"] = this.instructor;
            obj[dataset + "_title"] = this.title;
            obj[dataset + "_pass"] = this.pass;
            obj[dataset + "_fail"] = this.fail;
            obj[dataset + "_audit"] = this.audit;
            obj[dataset + "_uuid"] = this.uuid;
            obj[dataset + "_year"] = this.year;
        } else {
            obj["dept"] = this.dept;
            obj["id"] = this.id;
            obj["avg"] = this.avg;
            obj["instructor"] = this.instructor;
            obj["title"] = this.title;
            obj["pass"] = this.pass;
            obj["fail"] = this.fail;
            obj["audit"] = this.audit;
            obj["uuid"] = this.uuid;
            obj["year"] = this.year;
        }

        return obj;
    }

    constructor(dept: string, id: string, avg: number, instructor: string,
                title: string, pass: number, fail: number, audit: number, uuid: string, year: number) {
        super();
        this.dept = dept;
        this.id = id;
        this.avg = avg;
        this.instructor = instructor;
        this.title = title;
        this.pass = pass;
        this.fail = fail;
        this.audit = audit;
        this.uuid = uuid;
        this.year = year;
    }

}
