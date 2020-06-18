import {expect} from "chai";
import * as fs from "fs-extra";
import {InsightDataset, InsightDatasetKind, InsightError, NotFoundError} from "../src/controller/IInsightFacade";
import InsightFacade from "../src/controller/InsightFacade";
import Log from "../src/Util";
import TestUtil from "./TestUtil";
import * as path from "path";
import {GeoResponse, getLatLon} from "../src/model/GeoResponse";
import Scheduler from "../src/scheduler/Scheduler";

// This should match the schema given to TestUtil.validate(..) in TestUtil.readTestQueries(..)
// except 'filename' which is injected when the file is read.
export interface ITestQuery {
    title: string;
    query: any;  // make any to allow testing structurally invalid queries
    isQueryValid: boolean;
    result: any;
    filename: string;  // This is injected when reading the file
}

describe("GeoLocation tests", () => {
    it("Should fail on getting an invalid geolocation", () => {
        return getLatLon("").then(() => {
            expect.fail("Should not have fulfilled");
        }).catch((error) => {
            expect(error).to.be.an.instanceOf(InsightError);
        });
    });

    it("Should fail on getting an invalid geolocation", () => {
        return getLatLon("https://www.google.com").then(() => {
            expect.fail("Should not have fulfilled");
        }).catch((error) => {
            expect(error).to.be.an.instanceOf(InsightError);
        });
    });

    it("Should fail on timeout", () => {
        return getLatLon("https://www.google.com:81").then(() => {
            expect.fail("Should not have fulfilled");
        }).catch((error) => {
            expect(error).to.be.an.instanceOf(InsightError);
        });
    });

    it("Should fulfill on getting a valid geolocation", () => {
        const expected = {lat: 49.26767, lon: -123.25647} as GeoResponse;

        return getLatLon("6361 Memorial Road").then((response) => {
            expect(response).to.deep.equal(expected);
        }).catch((error) => {
            expect.fail("Should not have rejected");
        });
    });
});

describe("InsightFacade Add/Remove Dataset", function () {
    // Reference any datasets you've added to test/data here and they will
    // automatically be loaded in the 'before' hook.
    const datasetsToLoad: { [id: string]: string } = {
        courses: "./test/data/courses.zip",
        courses1: "./test/data/courses.zip",
        testImage: "./test/data/testimage.zip", // Not actually a ZIP File
        empty: "./test/data/courses_empty.zip",
        coursesFolderOnly: "./test/data/courses_only.zip",
        coursesInvalidJson: "./test/data/courses_invalid_json.zip",
        oneinvalid: "./test/data/oneinvalid.zip",
        threecourses: "./test/data/courses_3.zip",
        threeCoursesOneInvalid: "./test/data/courses_3_1invalid.zip",
        oneInvalidPicture: "./test/data/oneinvalid_picture.zip",
        coursesOneBlankSection: "./test/data/courses_one_blank_section.zip",
        coursesJsonWithUnexpectedType: "./test/data/courses_json_with_unexpected_type.zip",
        cpsc: "./test/data/cpsc.zip",
        rooms: "./test/data/rooms.zip",
        roomszero: "./test/data/rooms_zero.zip",
        roomsnoindex: "./test/data/rooms_noindex.zip",
        roomsnofolder: "./test/data/rooms_nofolder.zip",
        roomscorrupted: "./test/data/rooms_corruptedindex.zip",
        roomswithnotable: "./test/data/rooms_indexwithnotable.zip",
        roomswithnotheader: "./test/data/rooms_indexwithnotheader.zip",
        notr: "./test/data/rooms_headerwithnotr.zip",
        notbody: "./test/data/rooms_notbody.zip",
        excessiveheaders: "./test/data/rooms_excessiveheaders.zip",
        nofiles: "./test/data/rooms_nofiles.zip",
        oneless: "./test/data/rooms_oneless.zip",
        missingElement: "./test/data/rooms_missingelement.zip",
        missingCapacity: "./test/data/rooms_missingcapacity.zip",
        onewithnocapacity: "./test/data/rooms_onewithnocapacity.zip",
    };
    let datasets: { [id: string]: string } = {};
    let insightFacade: InsightFacade;
    const cacheDir = __dirname + "/../data";

    before(function () {
        // This section runs once and loads all datasets specified in the datasetsToLoad object
        // into the datasets object
        Log.test(`Before all`);
        for (const id of Object.keys(datasetsToLoad)) {
            datasets[id] = fs.readFileSync(datasetsToLoad[id]).toString("base64");
        }
    });

    beforeEach(function () {
        // This section resets the data directory (removing any cached data) and resets the InsightFacade instance
        // This runs before each test, which should make each test independent from the previous one
        Log.test(`BeforeTest: ${this.currentTest.title}`);
        try {
            fs.removeSync(cacheDir);
            fs.mkdirSync(cacheDir);
            fs.createFileSync(path.join(cacheDir, ".keep"));
            insightFacade = new InsightFacade();
        } catch (err) {
            Log.error(err);
        }
    });

    after(function () {
        Log.test(`After: ${this.test.parent.title}`);
    });

    afterEach(function () {
        Log.test(`AfterTest: ${this.currentTest.title}`);
    });

    // This is a unit test. You should create more like this!
    it("Should add a courses dataset", function () {
        const id: string = "courses";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect(result).to.deep.equal(expected);
            let filePath = path.join(cacheDir, (id + ".json"));

            expect(fs.existsSync(filePath)).to.be.equal(true);
        }).catch((err: any) => {
            expect.fail(err, expected, "Should not have rejected");
        });
    });

    it("Should add a rooms dataset", () => {
        const id = "rooms";
        const expected = ["rooms"];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Rooms).then((result) => {
            expect(result).to.deep.equal(expected);

            let filePath = path.join(cacheDir, (id + ".json"));
            expect(fs.existsSync(filePath)).to.be.equal(true);
            insightFacade = new InsightFacade();

            return insightFacade.listDatasets();
        }).then((result) => {
            expect(result.length).to.equal(1);
        }).catch((error) => {
            expect.fail("Should not have rejected");
        });
    });

    it("Should add a rooms dataset with one room w/ empty string", () => {
        const id = "oneless";
        const expected = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Rooms).then((result) => {
            expect(result).to.deep.equal(expected);
            return insightFacade.listDatasets();
        }).then((result) => {
            expect(result[0].numRows).to.equal(364);
        }).catch((error) => {
            expect.fail("Should not have rejected");
        });
    });

    it("Should add a rooms dataset with one room w/ no capacity", () => {
        const id = "onewithnocapacity";
        const expected = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Rooms).then((result) => {
            expect(result).to.deep.equal(expected);
            return insightFacade.listDatasets();
        }).then((result) => {
            expect(result[0].numRows).to.equal(5);
        }).catch((error) => {
            expect.fail("Should not have rejected");
        });
    });

    it("Should add a rooms dataset with one room w/ missing element", () => {
        const id = "missingElement";
        const expected = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Rooms).then((result) => {
            expect(result).to.deep.equal(expected);
            return insightFacade.listDatasets();
        }).then((result) => {
            expect(result[0].numRows).to.equal(363);
        }).catch((error) => {
            expect.fail("Should not have rejected");
        });
    });

    it("Should add a rooms dataset with one room w/ missing capacity", () => {
        const id = "missingCapacity";
        const expected = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Rooms).then((result) => {
            expect(result).to.deep.equal(expected);
            return insightFacade.listDatasets();
        }).then((result) => {
            expect(result[0].numRows).to.equal(363);
        }).catch((error) => {
            expect.fail("Should not have rejected");
        });
    });

    it("Should fail on adding courses DS as a rooms DS", function () {
        const id: string = "courses";
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Rooms).then((result: string[]) => {
            expect.fail("Should not have fulfilled!");
        }).catch((err: any) => {
            expect(err).to.be.an.instanceOf(InsightError);
        });
    });

    it("Should fail on adding rooms DS as a courses DS", function () {
        const id: string = "rooms";
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail("Should not have fulfilled!");
        }).catch((err: any) => {
            expect(err).to.be.an.instanceOf(InsightError);
        });
    });

    it("Should fail on adding a rooms DS with zero rooms", function () {
        const id: string = "roomszero";
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Rooms).then((result: string[]) => {
            expect.fail("Should not have fulfilled!");
        }).catch((err: any) => {
            expect(err).to.be.an.instanceOf(InsightError);
        });
    });

    it("Should fail on adding a rooms DS with no files", function () {
        const id: string = "nofiles";
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Rooms).then((result: string[]) => {
            expect.fail("Should not have fulfilled!");
        }).catch((err: any) => {
            expect(err).to.be.an.instanceOf(InsightError);
        });
    });

    it("Should fail on adding a rooms DS with no index.HTM", function () {
        const id: string = "roomsnoindex";
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Rooms).then((result: string[]) => {
            expect.fail("Should not have fulfilled!");
        }).catch((err: any) => {
            expect(err).to.be.an.instanceOf(InsightError);
        });
    });

    it("Should fail on adding a rooms DS with no rooms folder", function () {
        const id: string = "roomsnofolder";
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Rooms).then((result: string[]) => {
            expect.fail("Should not have fulfilled!");
        }).catch((err: any) => {
            expect(err).to.be.an.instanceOf(InsightError);
        });
    });

    it("Should fail on adding a rooms DS with no valid table in index.htm", function () {
        const id: string = "roomswithnotable";
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Rooms).then((result: string[]) => {
            expect.fail("Should not have fulfilled!");
        }).catch((err: any) => {
            expect(err).to.be.an.instanceOf(InsightError);
        });
    });

    it("Should fail on adding a rooms DS with no TR", function () {
        const id: string = "roomswithnotheader";
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Rooms).then((result: string[]) => {
            expect.fail("Should not have fulfilled!");
        }).catch((err: any) => {
            expect(err).to.be.an.instanceOf(InsightError);
        });
    });

    it("Should fail on adding a rooms DS with no THeader", function () {
        const id: string = "notr";
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Rooms).then((result: string[]) => {
            expect.fail("Should not have fulfilled!");
        }).catch((err: any) => {
            expect(err).to.be.an.instanceOf(InsightError);
        });
    });

    it("Should fail on adding a rooms DS with no TBody", function () {
        const id: string = "notbody";
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Rooms).then((result: string[]) => {
            expect.fail("Should not have fulfilled!");
        }).catch((err: any) => {
            expect(err).to.be.an.instanceOf(InsightError);
        });
    });

    it("Should fail on adding a corrupted index.htm", function () {
        const id: string = "roomscorrupted";
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Rooms).then((result: string[]) => {
            expect.fail("Should not have fulfilled!");
        }).catch((err: any) => {
            expect(err).to.be.an.instanceOf(InsightError);
        });
    });

    it("Should fail on adding something with excessive headers", function () {
        const id: string = "excessiveheaders";
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Rooms).then((result: string[]) => {
            expect.fail("Should not have fulfilled!");
        }).catch((err: any) => {
            expect(err).to.be.an.instanceOf(InsightError);
        });
    });

    it("Should not add a duplicate dataset.", function () {
        const id: string = "courses";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect(result).to.deep.equal(expected);
            return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then(() => {
                expect.fail("Should not have been accepted the second time");
            }).catch((err: any) => {
               expect(err).to.be.instanceOf(InsightError);
            });
        }).catch((err: any) => {
            expect.fail(err, expected, "Should not have rejected (at this point)");
        });
    });

    it("Should add multiple (non-duplicate) datasets", () => {
        const id1: string = "courses";
        const expected1: string[] = [id1];

        return insightFacade.addDataset(id1, datasets[id1], InsightDatasetKind.Courses).then((result1: string[]) => {
            expect(result1).to.deep.equal(expected1);
            const id2: string = "cpsc";
            const expected2: string[] = [id1, id2];

            return insightFacade.addDataset(id2, datasets[id2], InsightDatasetKind.Courses)
                .then((result2: string[]) => {
                    expect(result2).to.deep.equal(expected2);
            }).catch((err: any) => {
                    expect.fail(err, expected2, "Should not have rejected (second add)");
                });

        }).catch((err: any) => {
            expect.fail(err, expected1, "Should not have been rejected (first add)");
        });
    });

    it("Should not add an ID with only an underscore", () => {
        return insightFacade.addDataset("_", datasets["courses"], InsightDatasetKind.Courses).then(() => {
            expect.fail("Should not have fulfilled!");
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
        });
    });

    it("Should not add an ID with an underscore", () => {
        return insightFacade.addDataset("courses_", datasets["courses"], InsightDatasetKind.Courses).then(() => {
            expect.fail("Should not have fulfilled!");
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
        });
    });

    it("Should not add an ID with merely whitespace characters", () => {
        return insightFacade.addDataset(" ", datasets["courses"], InsightDatasetKind.Courses).then(() => {
            expect.fail("Should not have fulfilled!");
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
        });
    });

    it("Should not add an ID with an empty string", () => {
        return insightFacade.addDataset("", datasets["courses"], InsightDatasetKind.Courses).then(() => {
            expect.fail("Should not have fulfilled!");
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
        });
    });

    it("Should not add an ID that is undefined", () => {
        return insightFacade.addDataset(undefined, datasets["courses"], InsightDatasetKind.Courses).then(() => {
            expect.fail("Should not have fulfilled!");
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
        });
    });

    it("Should not add an undefined dataset", () => {
        return insightFacade.addDataset("courses", undefined, InsightDatasetKind.Courses).then(() => {
            expect.fail("Should not have fulfilled!");
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
        });
    });

    it("Should fail on undefined kind", () => {
        return insightFacade.addDataset("courses", datasets["courses"], undefined).then(() => {
            expect.fail("Should not have fulfilled!");
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
        });
    });

    it("Should not add an ID that is NULL", () => {
        return insightFacade.addDataset(null, datasets["courses"], InsightDatasetKind.Courses).then(() => {
            expect.fail("Should not have fulfilled!");
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
        });
    });

    it("Should not add a NULL dataset", () => {
        return insightFacade.addDataset("courses", null, InsightDatasetKind.Courses).then(() => {
            expect.fail("Should not have fulfilled!");
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
        });
    });

    it("Should fail on NULL kind", () => {
        return insightFacade.addDataset("courses", datasets["courses"], null).then(() => {
            expect.fail("Should not have fulfilled!");
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
        });
    });

    it("Should fail on adding an invalid ZIP file (a PNG file)", () => {
        return insightFacade.addDataset("test", datasets["testImage"], InsightDatasetKind.Courses).then(() => {
            expect.fail("Should not have fulfilled!");
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
        });
    });

    it("Should fail on adding an invalid ZIP file (empty ZIP file)", () => {
        const id = "empty";

        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then(() => {
            expect.fail("Shouldn't have fulfilled!");
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
        });
    });

    it("Should fail on adding an invalid ZIP file (ZIP file with just courses folder)", () => {
        const id = "coursesFolderOnly";

        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then(() => {
            expect.fail("Shouldn't have fulfilled!");
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);

        });
    });

    it("Should fail on adding an invalid ZIP file (ZIP file with unexpected type)", () => {
        const id = "coursesJsonWithUnexpectedType";

        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then(() => {
            expect.fail("Shouldn't have fulfilled!");
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
        });
    });

    it("Should fail on adding an invalid ZIP file (ZIP file with one invalid JSON)", () => {
        const id = "coursesInvalidJson";

        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then(() => {
            expect.fail("Shouldn't have fulfilled!");
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
        });
    });

    it("Should still add a ZIP file with just one out of many invalid JSONs", () => {
        const id: string = "oneinvalid";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect(result).to.deep.equal(expected);
        }).catch((err: any) => {
            expect.fail(err, expected, "Should not have rejected");
        });
    });

    it("Should add a valid dataset (even with one invalid item)", function () {
        const id: string = "oneInvalidPicture";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect(result).to.deep.equal(expected);
        }).catch((err: any) => {
            expect.fail(err, expected, "Should not have rejected");
        });
    });

    it("Should fail on adding an invalid dataset (with one blank section)", function () {
        const id: string = "coursesOneBlankSection";
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then(() => {
            expect.fail("Shouldn't have fulfilled!");
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
        });
    });

    // REMOVE DATASET TESTS
    it("Should remove a valid added dataset", (() => {
        const id: string = "courses";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect(result).to.deep.equal(expected);
            let filePath = path.join(cacheDir, (id + ".json"));

            expect(fs.existsSync(filePath)).to.be.equal(true);
            return insightFacade.removeDataset(id);
        }).then((resultRemove: string) => {
                expect(resultRemove).to.equal(id, "Should have returned the valid dataset's ID");
                let filePath = path.join(cacheDir, (id + ".json"));

                expect(fs.existsSync(filePath)).to.be.equal(false);
        }).catch((err: any) => {
            expect.fail(err, expected, "Should not have rejected");
        });
    }));

    it("Should remove valid added dataset and fail on removal", (() => {
        const id: string = "courses";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect(result).to.deep.equal(expected);
            return insightFacade.removeDataset(id).then((resultRemove: string) => {
                expect(resultRemove).to.equal(id, "Should have returned the valid dataset's ID");
                return insightFacade.removeDataset(id).then(() => {
                    expect.fail("Should have been rejected");
                }).catch((err: any) => {
                    expect(err).to.be.instanceOf(NotFoundError);
                });
            }).catch((err: any) => {
                expect.fail(err, expected, "Should not have rejected");
            });
        }).catch((err: any) => {
            expect.fail(err, expected, "Should not have rejected");
        });
    }));

    it("Should fail on trying to remove a nonexistent dataset", () => {
        const id: string = "courses";
        return insightFacade.removeDataset(id).then(() => {
           expect.fail("Should not have been fulfilled");
       }).catch((err: any) => {
            expect(err).to.be.instanceOf(NotFoundError);
       });
    });

    it("Should fail on trying to remove an invalid ID (whitespace)", () => {
        return insightFacade.removeDataset(" ").then(() => {
            expect.fail("Should not have been fulfilled");
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
        });
    });

    it("Should fail on trying to remove an invalid ID (underscore)", () => {
        return insightFacade.removeDataset("_").then(() => {
            expect.fail("Should not have been fulfilled");
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
        });
    });

    it("Should fail on trying to remove an invalid ID (undefined)", () => {
        return insightFacade.removeDataset(undefined).then(() => {
            expect.fail("Should not have been fulfilled");
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
        });
    });

    it("Should fail on trying to remove an invalid ID (null)", () => {
        return insightFacade.removeDataset(null).then(() => {
            expect.fail("Should not have been fulfilled");
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
        });
    });

    // LIST DATASET TESTS

    it("Should list the correct number of rows in a room dataset", () => {
        const id = "rooms";
        const expected = [id];

        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Rooms).then((result: string[]) => {
            expect(result).to.deep.equal(expected);
            return insightFacade.listDatasets();
        }).then((result: InsightDataset[]) => {
            let expectedInterface: InsightDataset = {id: id, kind: InsightDatasetKind.Rooms, numRows: 364};
            expect(result.length).to.equal(1);
            expect(result[0]).to.deep.equal(expectedInterface);
        }).catch((err: any) => {
            expect.fail(err, expected, "Should not have rejected");
        });
    });

    it("Should list a zero-long dataset", () => {
        return insightFacade.listDatasets()
            .then((result2: InsightDataset[]) => {
                expect(result2.length).to.equal(0);
            }).catch((err: any) => {
                expect.fail(err, [], "Should not have rejected");
            });
    });

    it("Should list a three-long dataset upon being added", () => {
        const id: string = "threecourses";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect(result).to.deep.equal(expected);
            return insightFacade.listDatasets();
        }).then((result2: InsightDataset[]) => {
            let expectedInterface: InsightDataset = {id: id, kind: InsightDatasetKind.Courses, numRows: 3};
            expect(result2.length).to.equal(1);
            expect(result2[0]).to.deep.equal(expectedInterface);
        }).catch((err: any) => {
            expect.fail(err, expected, "Should not have rejected");
        });
    });

    it("Should still list a three-long dataset with one invalid entry upon being added", () => {
        const id: string = "threeCoursesOneInvalid";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect(result).to.deep.equal(expected);
            return insightFacade.listDatasets();
        }).then((result2: InsightDataset[]) => {
            let expectedInterface: InsightDataset = {id: id, kind: InsightDatasetKind.Courses, numRows: 2};
            expect(result2.length).to.equal(1);
            expect(result2[0]).to.deep.equal(expectedInterface);
        }).catch((err: any) => {
            expect.fail(err, expected, "Should not have rejected");
        });
    });


});

/*
 * This test suite dynamically generates tests from the JSON files in test/queries.
 * You should not need to modify it; instead, add additional files to the queries directory.
 * You can still make tests the normal way, this is just a convenient tool for a majority of queries.
 */
describe("InsightFacade PerformQuery", () => {
    const datasetsToQuery: { [id: string]: any } = {
        courses: {id: "courses", path: "./test/data/courses.zip", kind: InsightDatasetKind.Courses},
        cpsc: {id: "cpsc", path: "./test/data/cpsc.zip", kind: InsightDatasetKind.Courses},
        rooms: {id: "rooms", path: "./test/data/rooms.zip", kind: InsightDatasetKind.Rooms}
    };
    let insightFacade: InsightFacade = new InsightFacade();
    let testQueries: ITestQuery[] = [];

    // Load all the test queries, and call addDataset on the insightFacade instance for all the datasets
    before(function () {
        Log.test(`Before: ${this.test.parent.title}`);

        // Load the query JSON files under test/queries.
        // Fail if there is a problem reading ANY query.
        try {
            testQueries = TestUtil.readTestQueries();
        } catch (err) {
            expect.fail("", "", `Failed to read one or more test queries. ${err}`);
        }

        // Load the datasets specified in datasetsToQuery and add them to InsightFacade.
        // Will fail* if there is a problem reading ANY dataset.
        const loadDatasetPromises: Array<Promise<string[]>> = [];
        for (const key of Object.keys(datasetsToQuery)) {
            const ds = datasetsToQuery[key];
            const data = fs.readFileSync(ds.path).toString("base64");
            loadDatasetPromises.push(insightFacade.addDataset(ds.id, data, ds.kind));
        }
        return Promise.all(loadDatasetPromises).catch((err) => {
            /* *IMPORTANT NOTE: This catch is to let this run even without the implemented addDataset,
             * for the purposes of seeing all your tests run.
             * For D1, remove this catch block (but keep the Promise.all)
             */
            return Promise.resolve("HACK TO LET QUERIES RUN");
        });
    });

    beforeEach(function () {
        Log.test(`BeforeTest: ${this.currentTest.title}`);
    });

    after(function () {
        Log.test(`After: ${this.test.parent.title}`);
    });

    afterEach(function () {
        Log.test(`AfterTest: ${this.currentTest.title}`);
    });

    // Dynamically create and run a test for each query in testQueries
    // Creates an extra "test" called "Should run test queries" as a byproduct. Don't worry about it
    it("Should run test queries", function () {
        describe("Dynamic InsightFacade PerformQuery tests", function () {
            for (const test of testQueries) {
                it(`[${test.filename}] ${test.title}`, function (done) {
                    insightFacade.performQuery(test.query).then((result) => {
                        TestUtil.checkQueryResult(test, result, done);
                    }).catch((err) => {
                        TestUtil.checkQueryResult(test, err, done);
                    });
                });
            }
        });
    });
});
