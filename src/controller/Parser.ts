import {InsightDatasetKind, InsightError} from "./IInsightFacade";
import Dataset, {isValidIDataset} from "../model/Dataset";
import {DATA_DIR} from "./DatasetManager";
import * as fs from "fs";
import * as path from "path";
import {
    SectionsParser,
} from "./SectionsParser";
import {BuildingsParser} from "./BuildingsParser";

export default class Parser {

    public static parseDatasetsFromDisk(): Dataset[] {

        let fileList = fs.readdirSync(DATA_DIR);

        let dsArray: Dataset[] = [];

        for (let file of fileList) {

                if (file !== ".keep") {
                    let pathToFile = path.join(DATA_DIR, file);

                    let json = JSON.parse(fs.readFileSync(pathToFile, {encoding: "utf8"}));

                    if (isValidIDataset(json)) {
                        dsArray.push(Dataset.constructFromInterface(json));
                    }
                }
            }

        return dsArray;
    }

    public static parseZipFile(id: string, content: string, type: InsightDatasetKind): Promise<Dataset> {
        switch (type) {
            case InsightDatasetKind.Courses:
                return SectionsParser.parseCoursesZipFile(id, content);
            case InsightDatasetKind.Rooms:
                return BuildingsParser.parseRoomsZipFile(id, content);
            default:
                return Promise.reject(new InsightError("Unsupported InsightDatasetKind"));
        }
    }
}
