import Dataset from "../model/Dataset";
import {InsightDataset, InsightDatasetKind, InsightError, NotFoundError} from "./IInsightFacade";
import Parser from "./Parser";
import * as fs from "fs";
import * as path from "path";

export const DATA_DIR = path.resolve(".", ".", "data");

export default class DatasetManager {

    private datasets: Map<string, Dataset>;

    constructor() {
        this.datasets = new Map();

        let loadedDatasets = Parser.parseDatasetsFromDisk();

        for (let dataset of loadedDatasets) {
            this.datasets.set(dataset.getID(), dataset);
        }
    }

    private validate(id: string, remove: boolean): void {
        if (id === null || id === undefined)   {
            throw new InsightError("Passed in null or undefined ID");
        }

        if (!DatasetManager.validateID(id)) {
            throw new InsightError("Invalid ID: contains whitespace or underscore");
        }

        let idExists = this.checkIDExists(id);

        if (remove) {
            if (!idExists) {
                throw new NotFoundError("Attempted to remove dataset " + id + ", which does not exist");
            }
        } else {
            if (idExists) {
                throw new InsightError("Dataset " + id + " already exists in the list");
            }
        }

    }

    private checkIDExists(id: string): boolean {
        return (this.datasets.get(id) !== undefined);
    }

    // Saves dataset to disk. Resolves with the path to the added dataset.
    private saveDatasetToDisk(id: string): Promise<string> {

        return new Promise((resolve, reject) => {

            let object = this.datasets.get(id).getDatasetObject();

            let json = JSON.stringify(object);

            let name = id + ".json";

            let filePath = path.join(DATA_DIR, name);

            fs.writeFileSync(filePath, json);

            resolve(filePath);
        });
    }

    // Removes dataset from disk. Resolves with the path to the removed dataset.
    private removeDataSetFromDisk(id: string): Promise<string> {
        return new Promise((resolve, reject) => {

            let filePath = path.join(DATA_DIR, (id + ".json"));

            fs.unlinkSync(filePath);

            resolve(filePath);
        });
    }

    public listDataSets(): Promise<InsightDataset[]> {
        return new Promise((resolve, reject) => {

            let iterator = this.datasets.values();
            let array: InsightDataset[] = [];

            for (let dataset of iterator) {
                array.push(dataset.returnInterfaceObject());
            }

            resolve(array);
        });
    }

    public removeDataSet(id: string): Promise<string> {
        return new Promise((resolve, reject) => {

            this.validate(id, true);

            this.datasets.delete(id);

            this.removeDataSetFromDisk(id).then(() => {
                resolve(id);
            });
        });
    }

    public addDataSet(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
        return new Promise((resolve, reject) => {

            this.validate(id, false);

            Parser.parseZipFile(id, content, kind).then((dataset) => {
              this.datasets.set(id, dataset);

              return this.saveDatasetToDisk(id);
            }).then((str) => {
                resolve(Array.from(this.datasets.keys()));
            }).catch((err: any) => {
                reject(err);
            });
        });
    }

    public getDatasetIDs(): string[] {
        return Array.from(this.datasets.keys());
    }

    public getDataSet(id: string): Dataset {
        return this.datasets.get(id);
    }

    public static validateID(id: string): boolean {
        return (id.trim() !== "") && (!id.includes("_"));
    }
}
