import * as chai from "chai";
import { expect } from "chai";
import * as fs from "fs-extra";
import * as chaiAsPromised from "chai-as-promised";
import { InsightDataset, InsightDatasetKind, InsightError, NotFoundError } from "../src/controller/IInsightFacade";
import InsightFacade from "../src/controller/InsightFacade";
import Log from "../src/Util";
import TestUtil from "./TestUtil";

// This should match the schema given to TestUtil.validate(..) in TestUtil.readTestQueries(..)
// except 'filename' which is injected when the file is read.
export interface ITestQuery {
    title: string;
    query: any;  // make any to allow testing structurally invalid queries
    isQueryValid: boolean;
    result: any;
    filename: string;  // This is injected when reading the file
}

describe("InsightFacade Add/Remove/List Dataset", function () {
    // Reference any datasets you've added to test/data here and they will
    // automatically be loaded in the 'before' hook.
    const datasetsToLoad: { [id: string]: string } = {
        courses: "./test/data/courses.zip",
        coursesCopy: "./test/data/courses-copy.zip",
        coursesEmpty: "./test/data/empty.zip",
        coursesInvalid: "./test/data/invalid-courses.zip",
        coursesMixedJson: "./test/data/mixed-json.zip",
        coursesNotJson: "./test/data/not-json-courses.zip",
        coursesOneValid: "./test/data/one-valid.zip",
        coursesWrongFolder: "./test/data/wrong-folder.zip",
        coursesWrongKeys: "./test/data/wrong-keys.zip",
        rooms: "./test/data/rooms.zip"
    };
    let datasets: { [id: string]: string } = {};
    let insightFacade: InsightFacade;
    const cacheDir = __dirname + "/../data";

    before(function () {
        // This section runs once and loads all datasets specified in the datasetsToLoad object
        // into the datasets object
        Log.test(`Before all`);
        chai.use(chaiAsPromised);
        if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir);
        }
        for (const id of Object.keys(datasetsToLoad)) {
            datasets[id] = fs.readFileSync(datasetsToLoad[id]).toString("base64");
        }
        try {
            insightFacade = new InsightFacade();
        } catch (err) {
            Log.error(err);
        }
    });

    beforeEach(function () {
        Log.test(`BeforeTest: ${this.currentTest.title}`);
    });

    after(function () {
        Log.test(`After: ${this.test.parent.title}`);
    });

    afterEach(function () {
        // This section resets the data directory (removing any cached data) and resets the InsightFacade instance
        // This runs after each test, which should make each test independent from the previous one
        Log.test(`AfterTest: ${this.currentTest.title}`);
        try {
            fs.removeSync(cacheDir);
            fs.mkdirSync(cacheDir);
            insightFacade = new InsightFacade();
        } catch (err) {
            Log.error(err);
        }
    });
    // This is a unit test. You should create more like this!
    // it("Should add a valid dataset", function () {
    //     const id: string = "rooms";
    //     const expected: string[] = [id];
    //     const futureResult: Promise<string[]> = insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Rooms);
    //     return expect(futureResult).to.eventually.deep.equal(expected);
    // });
});

// it("Should add two valid datasets", function () {
//     const id1: string = "courses";
//     const id2: string = "coursesOneValid";
//     const expected: string[] = [id1, id2];
//     // Maybe rewrite this!
//     return insightFacade.addDataset(id1, datasets[id1], InsightDatasetKind.Courses).then((result: string[]) => {
//         return insightFacade.addDataset(id2, datasets[id2], InsightDatasetKind.Courses).then((res: string[]) => {
//             expect(res).to.deep.equal(expected);
//         }).catch((err: any) => {
//             expect.fail(err, expected, "should add the second dataset successfully");
//         });
//     });
// });

// it("should not add an existing dataset", function () {
//     const id: string = "courses";
//     const expected: string[] = [id];
//     return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
//         // success adding the first dataset
//         return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((res: string[]) => {
//             expect.fail(res, expected, "should reject at the second time");
//         }).catch((err: any) => {
//             expect(err).to.be.instanceOf(InsightError);
//         });
//     }).catch((err: any) => {
//         expect.fail(err, expected, "should successfully add at the first time");
//     });
// });

// it("should not add a dataset with an empty id", function () {
//     const id: string = "";
//     const futureResult: Promise<string[]> = insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
//     return expect(futureResult).to.eventually.rejectedWith(InsightError);
// });

// it("should not add a dataset with an undefined id", function () {
//     const id: string = undefined;
//     const futureResult: Promise<string[]> = insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
//     return expect(futureResult).to.eventually.rejectedWith(InsightError);
// });

// it("should not add a dataset with a null id", function () {
//     const id: string = null;
//     const futureResult: Promise<string[]> = insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
//     return expect(futureResult).to.eventually.rejectedWith(InsightError);
// });

// it("should not add a dataset with an underscore id", function () {
//     const id: string = "_courses";
//     const futureResult: Promise<string[]> = insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
//     return expect(futureResult).to.eventually.rejectedWith(InsightError);
// });

// it("should not add a dataset with a whitespace id", function () {
//     const id: string = "   ";
//     const futureResult: Promise<string[]> = insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
//     return expect(futureResult).to.eventually.rejectedWith(InsightError);
// });

// it("should not add a dataset with a mixed whitespace id", function () {
//     const id: string = "courses ";
//     const futureResult: Promise<string[]> = insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
//     return expect(futureResult).to.eventually.rejectedWith(InsightError);
// });

// it("should not add a dataset with an empty content", function () {
//     const id: string = "courses";
//     const futureResult: Promise<string[]> = insightFacade.addDataset(id, "", InsightDatasetKind.Courses);
//     return expect(futureResult).to.eventually.rejectedWith(InsightError);
// });

// it("should not add a dataset with an undefined content", function () {
//     const id: string = "courses";
//     const futureResult: Promise<string[]> = insightFacade.addDataset(id, undefined, InsightDatasetKind.Courses);
//     return expect(futureResult).to.eventually.rejectedWith(InsightError);
// });

// it("should not add a dataset with a null content", function () {
//     const id: string = "courses";
//     const futureResult: Promise<string[]> = insightFacade.addDataset(id, null, InsightDatasetKind.Courses);
//     return expect(futureResult).to.eventually.rejectedWith(InsightError);
// });

// it("should not add a dataset with an invalid id", function () {
//     const id: string = "courses";
//     const futureResult: Promise<string[]> = insightFacade.addDataset(undefined, "", InsightDatasetKind.Courses);
//     return expect(futureResult).to.eventually.rejectedWith(InsightError);
// });

// it("should not add a dataset with an invalid kind", function () {
//     const id: string = "courses";
//     const futureResult: Promise<string[]> = insightFacade.addDataset(id, "", undefined);
//     return expect(futureResult).to.eventually.rejectedWith(InsightError);
// });

// it("should not add a dataset from an empty zip file", function () {
//     const id: string = "courses_empty";
//     const futureResult: Promise<string[]> = insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
//     return expect(futureResult).to.eventually.rejectedWith(InsightError);
// });

// it("should not add a dataset with invalid courses", function () {
//     const id: string = "coursesInvalid";
//     const futureResult: Promise<string[]> = insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
//     return expect(futureResult).to.eventually.rejectedWith(InsightError);
// });

// it("should add a dataset containing JSON and non-JSON files", function () {
//     const id: string = "coursesMixedJson";
//     const expected: string[] = [id];
//     const futureResult: Promise<string[]> = insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
//     return expect(futureResult).to.eventually.deep.equal(expected);
// });

// it("should not add a dataset containing non-JSON files", function () {
//     const id: string = "coursesNotJson";
//     const futureResult: Promise<string[]> = insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
//     return expect(futureResult).to.eventually.rejectedWith(InsightError);
// });

// it("should add a dataset containing one valid JSON file", function () {
//     const id: string = "coursesOneValid";
//     const expected: string[] = [id];
//     const futureResult: Promise<string[]> = insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
//     return expect(futureResult).to.eventually.deep.equal(expected);
// });

// it("should not add a dataset containing JSON files with wrong keys", function () {
//     const id: string = "coursesWrongKeys";
//     const futureResult: Promise<string[]> = insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
//     return expect(futureResult).to.eventually.rejectedWith(InsightError);
// });

// it("should not add a dataset from a wrong folder in a zip file", function () {
//     const id: string = "coursesWrongFolder";
//     const futureResult: Promise<string[]> = insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
//     return expect(futureResult).to.eventually.rejectedWith(InsightError);
// });

// // remove dataset
// it("should remove an existing dataset", function () {
//     const id: string = "courses";
//     const expected: string = "courses";
//     // const futureResult: Promise<string> = insightFacade.removeDataset(id);
//     // return expect(futureResult).to.eventually.rejectedWith(NotFoundError);
//     return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
//         return insightFacade.removeDataset(id).then((res: string) => {
//             expect(res).to.deep.equal(expected);
//         }).catch((err: any) => {
//             // should instead remove successfully
//             expect(err).to.rejectedWith(InsightError);
//         });
//     }).catch((err: any) => {
//         // should not give error when adding the first time
//         expect(err).to.rejectedWith(InsightError);
//     });
// });

// it("should not remove a non-existing dataset", function () {
//     const id: string = "courses";
//     const futureResult: Promise<string> = insightFacade.removeDataset(id);
//     return expect(futureResult).to.eventually.rejectedWith(NotFoundError);
// });

// it("should not remove a dataset with an empty id", function () {
//     const id: string = "";
//     const futureResult: Promise<string> = insightFacade.removeDataset(id);
//     return expect(futureResult).to.eventually.rejectedWith(InsightError);
// });

// it("should not remove a dataset with an undefined id", function () {
//     const futureResult: Promise<string> = insightFacade.removeDataset(undefined);
//     return expect(futureResult).to.eventually.rejectedWith(InsightError);
// });

// it("should not remove a dataset with a null id", function () {
//     const futureResult: Promise<string> = insightFacade.removeDataset(null);
//     return expect(futureResult).to.eventually.rejectedWith(InsightError);
// });

// it("should not remove a dataset with an underscore id", function () {
//     const id: string = "_courses";
//     const futureResult: Promise<string> = insightFacade.removeDataset(id);
//     return expect(futureResult).to.eventually.rejectedWith(InsightError);
// });

// it("should not remove a dataset with a whitespace id", function () {
//     const id: string = "   ";
//     const futureResult: Promise<string> = insightFacade.removeDataset(id);
//     return expect(futureResult).to.eventually.rejectedWith(InsightError);
// });

// it("should not remove a dataset with a mixed whitespace id", function () {
//     const id: string = "courses ";
//     const futureResult: Promise<string> = insightFacade.removeDataset(id);
//     return expect(futureResult).to.eventually.rejectedWith(InsightError);
// });

// // NotFoundError
// it("should not remove a dataset with a non-existing id", function () {
//     const id: string = "whatever";
//     const futureResult: Promise<string> = insightFacade.removeDataset(id);
//     return expect(futureResult).to.eventually.rejectedWith(NotFoundError);
// });

// // list dataset
// it("should list zero added datasets", function () {
//     const expected: InsightDataset[] = [];
//     const futureResult: Promise<InsightDataset[]> = insightFacade.listDatasets();
//     return expect(futureResult).to.eventually.deep.equal(expected);
// });

// it("should list one added dataset", function () {
//     const id: string = "courses";
//     const expected: InsightDataset[] = [];
//     return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
//         return insightFacade.listDatasets().then((res: InsightDataset[]) => {
//             expect(res[0].id).to.equal("courses");
//             expect(res[0].kind).to.equal(InsightDatasetKind.Courses);
//             expect(res.length).to.equal(1);
//         }).catch((err: any) => {
//             expect.fail(err, null, "should only fulfill!");
//         });
//     }).catch((err: any) => {
//         expect.fail(err, null, "should only fulfill!");
//     });
// });

// it("should list two added datasets", function () {
//     const id1: string = "courses";
//     const id2: string = "coursesOneValid";
//     const expected: string[] = [id1, id2];
//     return insightFacade.addDataset(id1, datasets[id1], InsightDatasetKind.Courses).then((result: string[]) => {
//         return insightFacade.addDataset(id2, datasets[id2], InsightDatasetKind.Courses).then((res: string[]) => {
//             return insightFacade.listDatasets().then((rst: InsightDataset[]) => {
//                 expect(rst[0].id).to.equal(id1);
//                 expect(rst[0].kind).to.equal(InsightDatasetKind.Courses);
//                 expect(rst[1].id).to.equal(id2);
//                 expect(rst[1].kind).to.equal(InsightDatasetKind.Courses);
//                 expect(rst.length).to.equal(2);
//             });
//         });
//     }).catch((err: any) => {
//         expect.fail(err, null, "should only fulfill!");
//     });
// });
// });

/*
 * This test suite dynamically generates tests from the JSON files in test/queries.
 * You should not need to modify it; instead, add additional files to the queries directory.
 * You can still make tests the normal way, this is just a convenient tool for a majority of queries.
 */
// describe("InsightFacade PerformQuery", () => {
//     const datasetsToQuery: { [id: string]: {path: string, kind: InsightDatasetKind} } = {
//         courses: {path: "./test/data/courses.zip", kind: InsightDatasetKind.Courses},
//     };
//     let insightFacade: InsightFacade;
//     let testQueries: ITestQuery[] = [];

//     // Load all the test queries, and call addDataset on the insightFacade instance for all the datasets
//     before(function () {
//         Log.test(`Before: ${this.test.parent.title}`);

//         // Load the query JSON files under test/queries.
//         // Fail if there is a problem reading ANY query.
//         try {
//             testQueries = TestUtil.readTestQueries();
//         } catch (err) {
//             expect.fail("", "", `Failed to read one or more test queries. ${err}`);
//         }

//         // Load the datasets specified in datasetsToQuery and add them to InsightFacade.
//         // Will fail* if there is a problem reading ANY dataset.
//         const loadDatasetPromises: Array<Promise<string[]>> = [];
//         insightFacade = new InsightFacade();
//         for (const id of Object.keys(datasetsToQuery)) {
//             const ds = datasetsToQuery[id];
//             const data = fs.readFileSync(ds.path).toString("base64");
//             loadDatasetPromises.push(insightFacade.addDataset(id, data, ds.kind));
//         }
//         return Promise.all(loadDatasetPromises);
//     });

//     beforeEach(function () {
//         Log.test(`BeforeTest: ${this.currentTest.title}`);
//     });

//     after(function () {
//         Log.test(`After: ${this.test.parent.title}`);
//     });

//     afterEach(function () {
//         Log.test(`AfterTest: ${this.currentTest.title}`);
//     });

//     // Dynamically create and run a test for each query in testQueries
//     // Creates an extra "test" called "Should run test queries" as a byproduct. Don't worry about it
//     it("Should run test queries", function () {
//         describe("Dynamic InsightFacade PerformQuery tests", function () {
//             for (const test of testQueries) {
//                 it(`[${test.filename}] ${test.title}`, function () {
//                     const futureResult: Promise<any[]> = insightFacade.performQuery(test.query);
//                     return TestUtil.verifyQueryResult(futureResult, test);
//                 });
//             }
//         });
//     });
// });
