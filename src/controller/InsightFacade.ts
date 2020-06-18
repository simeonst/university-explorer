import Log from "../Util";
import {IInsightFacade, InsightDataset, InsightDatasetKind} from "./IInsightFacade";
import {InsightError, NotFoundError} from "./IInsightFacade";
import DatasetManager from "./DatasetManager";
import QueryEngine from "./QueryEngine";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */

export default class InsightFacade implements IInsightFacade {

    private dsManager: DatasetManager;

    constructor() {
        Log.trace("InsightFacadeImpl::init()");
        this.dsManager = new DatasetManager();
    }

    public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
        return this.dsManager.addDataSet(id, content, kind);
    }

    public removeDataset(id: string): Promise<string> {
        return this.dsManager.removeDataSet(id);
    }

    public performQuery(query: any): Promise<any[]> {
        let queryEngine = new QueryEngine(this.dsManager);
        return queryEngine.performQuery(query);
    }

    public listDatasets(): Promise<InsightDataset[]> {
        return this.dsManager.listDataSets();
    }
}
