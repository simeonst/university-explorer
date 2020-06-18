import {InsightDataset, InsightDatasetKind} from "../controller/IInsightFacade";
import Section, {isValidSection} from "./Section";
import DatasetManager from "../controller/DatasetManager";
import {Data} from "./Data";
import {isValidRoom, Room} from "./Room";
export interface IDataset {
    id: string;
    kind: InsightDatasetKind;
    data: Data[];
}

export function isValidIDataset(arg: any): arg is IDataset {
    return (arg.id !== undefined) && (typeof arg.id === "string") && (DatasetManager.validateID(arg.id)) &&
    (arg.kind !== undefined) && (Object.values(InsightDatasetKind).includes(arg.kind)) &&
    (arg.data !== undefined) && (Array.isArray(arg.data));
}

export default class Dataset {
    private readonly id: string;
    private readonly kind: InsightDatasetKind;
    private readonly data: Data[];

    public static constructFromInterface(json: IDataset): Dataset {

        let ds = new Dataset(json.id, json.kind);

        if (json.kind === InsightDatasetKind.Courses) {
            for (let section of json.data) {
                if (isValidSection(section)) {
                    ds.addData(Section.constructFromInterface(section));
                }
            }
        } else {
            for (let room of json.data) {
                if (isValidRoom(room)) {
                    ds.addData(Room.constructFromInterface(room));
                }
            }
        }

        return ds;
    }

    constructor(id: string, kind: InsightDatasetKind) {
        this.id = id;
        this.kind = kind;
        this.data = [];
    }

    public getID() {
        return this.id;
    }

    public getData() {
        return this.data;
    }

    public addData(data: Data): void {
        this.data.push(data);
    }

    public returnInterfaceObject(): InsightDataset {
        return {id: this.id, kind: this.kind, numRows: this.data.length};
    }

    public getNumberOfRows(): number {
        return this.data.length;
    }

    public getDatasetObject(): object {
        return {
            id: this.id,
            kind: this.kind,
            data: this.data,
        };
    }

    public getDatasetKind(): InsightDatasetKind {
        return this.kind;
    }

}
