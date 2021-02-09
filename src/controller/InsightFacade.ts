import Log from "../Util";
import { IInsightFacade, InsightDataset, InsightDatasetKind, ResultTooLargeError } from "./IInsightFacade";
import { InsightError, NotFoundError } from "./IInsightFacade";
import * as fse from "fs-extra";
import * as JSZip from "jszip";
import QueryHandler from "./QueryHandler";
import { RoomDatasetHandler } from "./RoomDatasetHandler";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
    private datasets: { [id: string]: object[] };
    private metaInfo: { [id: string]: any };

    constructor() {
        Log.trace("InsightFacadeImpl::init()");
        this.datasets = {};
        this.metaInfo = {};
    }

    public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
        const path = "./data";
        let cacheFiles: string[];

        try {
            // Make a ./data directory if not existing
            if (!fse.existsSync(path)) {
                fse.mkdirSync(path);
            }
            cacheFiles = fse.readdirSync(path);
            if (cacheFiles.length !== 0) {
                this.loadCache(cacheFiles);
            }
            this.idValidCheck(id);
            this.idDuplicateCheck(id);
            this.contentValidCheck(content);
            if (kind === InsightDatasetKind.Courses) {
                return this.addDatasetHelper(id, content, kind);
            } else if (kind === InsightDatasetKind.Rooms) {
                let roomDatasetHandler = new RoomDatasetHandler(id, content, this.datasets, this.metaInfo);
                let retval = roomDatasetHandler.addRoomDataset();
                this.metaInfo = roomDatasetHandler.metaInfo;
                this.datasets = roomDatasetHandler.datasets;
                return retval;
            } else {
                throw new InsightError("invalid kind");
            }
        } catch (e) {
            return Promise.reject(new InsightError(e.message));
        }
    }

    public removeDataset(id: string): Promise<string> {
        try {
            this.idValidCheck(id);
            if (Object.keys(this.datasets).includes(id)) {
                delete this.datasets[id];
                delete this.metaInfo[id];
                fse.writeFileSync(`./data/metaInfo.json`, JSON.stringify(this.metaInfo));
                fse.unlinkSync(`./data/${id}.json`);
                return Promise.resolve(id);
            } else {
                return Promise.reject(new NotFoundError());
            }
        } catch (e) {
            return Promise.reject(new InsightError(e.message));
        }
    }

    public performQuery(query: any): Promise<any[]> {
        let cacheFiles: string[];
        try {
            if (!fse.existsSync("./data")) {
                fse.mkdirSync("./data");
            }
            cacheFiles = fse.readdirSync("./data");
            if (cacheFiles.length !== 0) {
                this.loadCache(cacheFiles);
            }
            // Validate query
            let queryHandler = new QueryHandler(this.datasets, query);
            return Promise.resolve(queryHandler.runQuery());
        } catch (e) {
            return Promise.reject(new InsightError(e.message));
        }
    }

    public listDatasets(): Promise<InsightDataset[]> {
        let cacheFiles: string[] = fse.readdirSync("./data");
        let insightDatasetList: InsightDataset[] = [];

        if (cacheFiles.length === 0) {
            return Promise.resolve(insightDatasetList);
        }

        this.loadCache(cacheFiles);
        Object.values(this.metaInfo).forEach((value) => {
            let insightDataset: InsightDataset = {
                id: value.id,
                kind: value.kind,
                numRows: value.numRows
            };
            insightDatasetList.push(insightDataset);
        });
        return Promise.resolve(insightDatasetList);
    }

    /**
     * Loads cache from /data folder if exists, otherwise do nothing
     * @param cacheFiles
     */
    private loadCache(cacheFiles: string[]) {
        let that = this;
        cacheFiles.forEach((item: any) => {
            let name: string = item.split(".")[0];
            if (name !== "metaInfo") {
                const datasetPath = `./data/${name}.json`;
                const datasetContent: string = fse.readFileSync(datasetPath).toString();
                that.datasets[name] = JSON.parse(datasetContent);
            }
        });
        this.metaInfo = JSON.parse(fse.readFileSync(`./data/metaInfo.json`).toString());
    }

    /**
     * Checks the validity of id
     * @param id
     */
    private idValidCheck(id: string) {
        if (id.includes("_")) {
            throw new InsightError("Dataset id should not include underscore!");
        }
        if (id.indexOf(" ") >= 0) {
            throw new InsightError("Dataset id should not include whitespace!");
        }
        if (id === "" || id === null || id === undefined) {
            throw new InsightError("Dataset id is null or undefined!");
        }
    }

    /**
     * Check if dataset id is duplicated
     * @param id
     */
    private idDuplicateCheck(id: string) {
        if (Object.keys(this.datasets).includes(id)) {
            throw new InsightError("Duplicate dataset id!");
        }
    }

    /**
     * Check if content is null
     * @param content
     */
    private contentValidCheck(content: string) {
        if ([null, undefined, ""].includes(content)) {
            throw new InsightError("content is null!");
        }
    }

    private kindValidCheck(kind: InsightDatasetKind) {
        if (kind === InsightDatasetKind.Rooms) {
            throw new InsightError("Kind should be courses!");
        }
    }

    /**
     * Loads dataset from a given zip file
     * @param id
     * @param content
     * @param kind
     */
    private addDatasetHelper(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
        let that = this;
        try {
            let jsZip = new JSZip();
            return jsZip.loadAsync(content, { base64: true }).then((zip: JSZip) => {
                const promiseList: Array<Promise<any>> = [];
                const courseList: object[] = [];

                // Add each JSON file into our internal data structure
                zip.folder("courses").forEach((relativePath, file: any) => {
                    promiseList.push(this.addCourses(file, courseList));
                });

                // Need all promises to resolve
                return Promise.all(promiseList).then(() => {
                    if (courseList.length === 0) {
                        throw new InsightError(("No courses!"));
                    }
                    that.extractFields(id, courseList, kind);
                    return Object.keys(that.datasets);
                });
            }).catch((e) => {
                throw new InsightError(e.message);
            });
        } catch (e) {
            throw new InsightError(e.message);
        }
    }

    /**
     * Adds individual courses to a list of courses
     * @param file
     * @param courseList
     */
    public addCourses(file: any, courseList: object[]): Promise<any> {
        return file.async("string").then((results: string) => {
            try {
                let coursesContent = JSON.parse(results);
                coursesContent.result.forEach((course: any) => {
                    courseList.push(course);
                });
            } catch (e) {
                Log.test("Non-JSON file detected, ignore!");
            }
        }).catch((err: any) => {
            throw new InsightError(err.message);
        });
    }

    /**
     * Extracts the keys from the raw dataset
     * @param id
     * @param courseList
     * @param kind
     */
    private extractFields(id: string, courseList: object[], kind: InsightDatasetKind) {
        let results: object[] = [];
        courseList.forEach((idKey: any) => {
            const courseObj: { [idKey: string]: any } = {};
            courseObj[`${id}_title`] = idKey["Title"];
            courseObj[`${id}_uuid`] = idKey["id"].toString();
            courseObj[`${id}_id`] = idKey["Course"].toString();
            courseObj[`${id}_dept`] = idKey["Subject"];
            courseObj[`${id}_pass`] = idKey["Pass"];
            courseObj[`${id}_fail`] = idKey["Fail"];
            courseObj[`${id}_audit`] = idKey["Audit"];
            courseObj[`${id}_avg`] = idKey["Avg"];
            courseObj[`${id}_instructor`] = idKey["Professor"];
            courseObj[`${id}_year`] = idKey["Section"] === "overall" ? 1900 : parseInt(idKey["Year"], 10);
            results.push(courseObj);
        });
        this.storeAndWriteCache(results, id, kind);
    }

    /**
     * Writes the datasets and meta information onto disk
     * @param courseList
     * @param id
     * @param kind
     */
    private storeAndWriteCache(courseList: object[], id: string, kind: InsightDatasetKind) {
        let metaObj: { [name: string]: any } = {};
        metaObj["id"] = id;
        metaObj["kind"] = kind;
        metaObj["numRows"] = courseList.length;
        this.datasets[id] = courseList;
        this.metaInfo[id] = metaObj;

        const datasetCachePath = `./data/${id}.json`;
        const metaCachePath = `./data/metaInfo.json`;
        fse.createFileSync(datasetCachePath);
        fse.writeFileSync(datasetCachePath, JSON.stringify(this.datasets[id]));
        fse.writeFileSync(metaCachePath, JSON.stringify(this.metaInfo));
    }
}
