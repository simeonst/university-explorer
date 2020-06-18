import Dataset from "../model/Dataset";
import {InsightDatasetKind, InsightError} from "./IInsightFacade";
import * as JSZip from "jszip";
import Section from "../model/Section";

export interface ISectionFromZip {
    id: number;
    Subject: string;
    Course: string;
    Avg: number;
    Professor: string;
    Title: string;
    Pass: number;
    Fail: number;
    Audit: number;
    Year: string;
    Section: string;
}

export function isValidJsonFromZip(arg: any): arg is IValidJsonFromZip {
    return ((arg.result !== undefined) && Array.isArray(arg.result)
        && (arg.rank !== undefined && typeof arg.rank === "number"));
}

export function isValidSectionFromZip(arg: any): arg is ISectionFromZip {
    return ((arg.id !== undefined) && (typeof arg.id === "number")
        && (arg.Subject !== undefined) && (typeof arg.Subject === "string")
        && (arg.Course !== undefined) && (typeof arg.Course === "string")
        && (arg.Avg !== undefined) && (typeof arg.Avg === "number")
        && (arg.Professor !== undefined) && (typeof arg.Professor === "string")
        && (arg.Title !== undefined) && (typeof arg.Title === "string")
        && (arg.Pass !== undefined) && (typeof arg.Pass === "number")
        && (arg.Fail !== undefined) && (typeof arg.Fail === "number")
        && (arg.Audit !== undefined) && (typeof arg.Audit === "number")
        && (arg.Year !== undefined) && (typeof arg.Year === "string") && (!isNaN(arg.Year))
        && Number.isInteger(Number(arg.Year))
        && (arg.Section !== undefined) && (typeof arg.Section === "string")
    );
}

export interface IValidJsonFromZip {
    result: any[];
    rank: number;
}

export class SectionsParser {
    public static parseCoursesZipFile(id: string, content: string): Promise<Dataset> {
        return new Promise((resolve, reject) => {
            let d = new Dataset(id, InsightDatasetKind.Courses);
            let zip = new JSZip();

            zip.loadAsync(content, {base64: true}).then((newZip) => {
                let promiseArray: Array<Promise<any>> = [];
                newZip.folder("courses").forEach((relativePath, file) => {
                    promiseArray.push(file.async("text"));
                });

                return Promise.all(promiseArray);
            })
                .then((values) => {
                    for (let val of values) {
                        try {
                            let json = JSON.parse(val);
                            if (isValidJsonFromZip(json)) {
                                let sections = SectionsParser.parseSections(json);
                                for (let section of sections) {
                                    d.addData(section);
                                }
                            }
                        } catch (err) {
                            // comment here because the linter hates me :(
                        }
                    }

                    if (d.getNumberOfRows() > 0) {
                        resolve(d);
                    } else {
                        reject(new InsightError("Dataset has zero sections"));
                    }
                })
                .catch((err: any) => {
                    reject(new InsightError("Error loading ZIP file. Error: " + err));
                });
        });
    }

    private static parseSections(json: IValidJsonFromZip): Section[] {
        let sections: Section[] = [];

        let result: any = json["result"];

        for (let section of result) {
            if (isValidSectionFromZip(section)) {
                let s: Section = SectionsParser.parseSection(section);
                sections.push(s);
            }
        }
        return sections;
    }

    private static parseSection(json: ISectionFromZip): Section {
        let dept = json.Subject;
        let id = json.Course;
        let avg = json.Avg;
        let instructor = json.Professor;
        let title = json.Title;
        let pass = json.Pass;
        let fail = json.Fail;
        let audit = json.Audit;
        let uuid = json.id;
        let year = (json.Section === "overall" ? 1900 : json.Year);

        return new Section(dept, id, avg, instructor, title, pass, fail, audit, uuid.toString(), Number(year));
    }

}


