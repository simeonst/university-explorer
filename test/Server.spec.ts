import Server from "../src/rest/Server";

import chai = require("chai");
import chaiHttp = require("chai-http");
import Response = ChaiHttp.Response;
import {expect} from "chai";
import Log from "../src/Util";
import {InsightDataset} from "../src/controller/IInsightFacade";
import * as fs from "fs-extra";

describe("Facade D3", function () {

    let server: Server = null;
    let SERVER_URL = "http://localhost:4321";

    let invalidQuery = {OPTIONS: {}};

    let validQuery = {
        WHERE: {
            GT: {
                rooms_seats: 50
            }
        },
        OPTIONS: {
            COLUMNS: [
                "rooms_name"
            ],
            ORDER: "rooms_name"
        }
    };
    let validQueryExpected = [
        {
            rooms_name: "AERL_120"
        },
        {
            rooms_name: "ALRD_105"
        },
        {
            rooms_name: "ANGU_037"
        },
        {
            rooms_name: "ANGU_039"
        },
        {
            rooms_name: "ANGU_098"
        },
        {
            rooms_name: "ANGU_234"
        },
        {
            rooms_name: "ANGU_241"
        },
        {
            rooms_name: "ANGU_243"
        },
        {
            rooms_name: "ANGU_254"
        },
        {
            rooms_name: "ANGU_291"
        },
        {
            rooms_name: "ANGU_295"
        },
        {
            rooms_name: "ANGU_334"
        },
        {
            rooms_name: "ANGU_343"
        },
        {
            rooms_name: "ANGU_345"
        },
        {
            rooms_name: "ANGU_347"
        },
        {
            rooms_name: "ANGU_350"
        },
        {
            rooms_name: "ANGU_435"
        },
        {
            rooms_name: "ANSO_207"
        },
        {
            rooms_name: "BIOL_2000"
        },
        {
            rooms_name: "BIOL_2200"
        },
        {
            rooms_name: "BRKX_2365"
        },
        {
            rooms_name: "BUCH_A101"
        },
        {
            rooms_name: "BUCH_A102"
        },
        {
            rooms_name: "BUCH_A103"
        },
        {
            rooms_name: "BUCH_A104"
        },
        {
            rooms_name: "BUCH_A201"
        },
        {
            rooms_name: "BUCH_A202"
        },
        {
            rooms_name: "BUCH_A203"
        },
        {
            rooms_name: "BUCH_B208"
        },
        {
            rooms_name: "BUCH_B213"
        },
        {
            rooms_name: "BUCH_B215"
        },
        {
            rooms_name: "BUCH_B313"
        },
        {
            rooms_name: "BUCH_B315"
        },
        {
            rooms_name: "BUCH_D217"
        },
        {
            rooms_name: "BUCH_D218"
        },
        {
            rooms_name: "BUCH_D219"
        },
        {
            rooms_name: "BUCH_D222"
        },
        {
            rooms_name: "CEME_1202"
        },
        {
            rooms_name: "CEME_1204"
        },
        {
            rooms_name: "CHBE_101"
        },
        {
            rooms_name: "CHBE_102"
        },
        {
            rooms_name: "CHBE_103"
        },
        {
            rooms_name: "CHEM_B150"
        },
        {
            rooms_name: "CHEM_B250"
        },
        {
            rooms_name: "CHEM_C124"
        },
        {
            rooms_name: "CHEM_C126"
        },
        {
            rooms_name: "CHEM_D200"
        },
        {
            rooms_name: "CHEM_D300"
        },
        {
            rooms_name: "CIRS_1250"
        },
        {
            rooms_name: "DMP_110"
        },
        {
            rooms_name: "DMP_301"
        },
        {
            rooms_name: "DMP_310"
        },
        {
            rooms_name: "ESB_1012"
        },
        {
            rooms_name: "ESB_1013"
        },
        {
            rooms_name: "ESB_2012"
        },
        {
            rooms_name: "FNH_40"
        },
        {
            rooms_name: "FNH_60"
        },
        {
            rooms_name: "FORW_303"
        },
        {
            rooms_name: "FRDM_153"
        },
        {
            rooms_name: "FSC_1001"
        },
        {
            rooms_name: "FSC_1003"
        },
        {
            rooms_name: "FSC_1005"
        },
        {
            rooms_name: "FSC_1221"
        },
        {
            rooms_name: "GEOG_100"
        },
        {
            rooms_name: "GEOG_101"
        },
        {
            rooms_name: "GEOG_147"
        },
        {
            rooms_name: "GEOG_200"
        },
        {
            rooms_name: "GEOG_212"
        },
        {
            rooms_name: "HEBB_10"
        },
        {
            rooms_name: "HEBB_100"
        },
        {
            rooms_name: "HEBB_12"
        },
        {
            rooms_name: "HEBB_13"
        },
        {
            rooms_name: "HENN_200"
        },
        {
            rooms_name: "HENN_201"
        },
        {
            rooms_name: "HENN_202"
        },
        {
            rooms_name: "IBLC_182"
        },
        {
            rooms_name: "IBLC_261"
        },
        {
            rooms_name: "IONA_301"
        },
        {
            rooms_name: "LASR_102"
        },
        {
            rooms_name: "LASR_104"
        },
        {
            rooms_name: "LASR_105"
        },
        {
            rooms_name: "LASR_107"
        },
        {
            rooms_name: "LSC_1001"
        },
        {
            rooms_name: "LSC_1002"
        },
        {
            rooms_name: "LSC_1003"
        },
        {
            rooms_name: "LSK_200"
        },
        {
            rooms_name: "LSK_201"
        },
        {
            rooms_name: "LSK_460"
        },
        {
            rooms_name: "MATH_100"
        },
        {
            rooms_name: "MATH_102"
        },
        {
            rooms_name: "MATX_1100"
        },
        {
            rooms_name: "MCLD_202"
        },
        {
            rooms_name: "MCLD_214"
        },
        {
            rooms_name: "MCLD_228"
        },
        {
            rooms_name: "MCLD_242"
        },
        {
            rooms_name: "MCLD_254"
        },
        {
            rooms_name: "MCML_158"
        },
        {
            rooms_name: "MCML_160"
        },
        {
            rooms_name: "MCML_166"
        },
        {
            rooms_name: "ORCH_1001"
        },
        {
            rooms_name: "ORCH_3074"
        },
        {
            rooms_name: "ORCH_4074"
        },
        {
            rooms_name: "OSBO_A"
        },
        {
            rooms_name: "PHRM_1101"
        },
        {
            rooms_name: "PHRM_1201"
        },
        {
            rooms_name: "PHRM_3208"
        },
        {
            rooms_name: "SCRF_100"
        },
        {
            rooms_name: "SCRF_209"
        },
        {
            rooms_name: "SOWK_124"
        },
        {
            rooms_name: "SPPH_B151"
        },
        {
            rooms_name: "SRC_220A"
        },
        {
            rooms_name: "SRC_220B"
        },
        {
            rooms_name: "SRC_220C"
        },
        {
            rooms_name: "SWNG_121"
        },
        {
            rooms_name: "SWNG_122"
        },
        {
            rooms_name: "SWNG_221"
        },
        {
            rooms_name: "SWNG_222"
        },
        {
            rooms_name: "UCLL_103"
        },
        {
            rooms_name: "WESB_100"
        },
        {
            rooms_name: "WESB_201"
        },
        {
            rooms_name: "WOOD_1"
        },
        {
            rooms_name: "WOOD_2"
        },
        {
            rooms_name: "WOOD_3"
        },
        {
            rooms_name: "WOOD_4"
        },
        {
            rooms_name: "WOOD_5"
        },
        {
            rooms_name: "WOOD_6"
        }
    ];

    chai.use(chaiHttp);

    before(function () {
        server = new Server(4321);
        // TODO: start server here once and handle errors properly
        return server.start().then((result) => {
            return Promise.resolve(result);
        }).catch((err) => {
            return Promise.reject(err);
        });
    });

    after(function () {
        server.stop();
    });

    beforeEach(function () {
        Log.trace("Before each: Clearing all datasets");
        return Server.insightFacade.listDatasets().then((result) => {
            let promiseArray = [];

            for (let ds of result) {
                Log.trace("Dataset: " + ds.id);
                promiseArray.push(Server.insightFacade.removeDataset(ds.id));
            }

            return Promise.all(promiseArray);
        }).then((result) => {
            Log.trace("Before each: cleared all datasets");
            Promise.resolve(result);
        }).catch((err) => {
            Log.trace("Before each: error clearing datasets. Error: " + err);
            Promise.reject(err);
        });
    });

    afterEach(function () {
        Log.trace("Entered after each");
        // might want to add some process logging here to keep track of what"s going on
    });

    it("ECHO test", () => {
        try {
            return chai.request(SERVER_URL)
                .get("/echo/myna")
                .then((res) => {
                    expect(res.status).to.be.equal(200);
                    expect(res.body.result).to.deep.equal("myna...myna");
                })
                .catch((err) => {
                    Log.error(err);
                    expect.fail(err);
                });
        } catch (err) {
            expect.fail(err);
        }
    });

    it("ECHO test - no message provided", () => {
        try {
            return chai.request(SERVER_URL)
                .get("/echo/")
                .then((res) => {
                    expect(res.status).to.be.equal(200);
                    expect(res.body.result).to.deep.equal("...");
                })
                .catch((err) => {
                    Log.error(err);
                    expect.fail(err);
                });
        } catch (err) {
            expect.fail(err);
        }
    });

    it("GET datasets test", () => {
        let expected: InsightDataset[] = [];
        try {
            return chai.request(SERVER_URL)
                .get("/datasets")
                .then((res) => {
                    expect(res.status).to.be.equal(200);
                    expect(res.body.result).to.deep.equal(expected);
                });
        } catch (err) {
            expect.fail("Error while getting datasets: " + err.message);
        }
    });

    it("Should return error 404 on trying to delete a nonexistent dataset", () => {
        try {
            return chai.request(SERVER_URL)
                .del("/dataset/koel")
                .then((res) => {
                    expect.fail("Should not have succeeded");
                }).catch((err) => {
                    expect(err.response).to.have.status(404);
                });
        } catch (err) {
            expect.fail("Error in DELETE test: " + err.message);
        }
    });

    it("Should return error 400 on trying to delete a dataset with invalid ID", () => {
        try {
            return chai.request(SERVER_URL)
                .del("/dataset/koel_")
                .then((res) => {
                    expect.fail("Should not have succeeded");
                }).catch((err) => {
                    expect(err.response).to.have.status(400);
                });
        } catch (err) {
            expect.fail("Error in DELETE test: " + err.message);
        }
    });

    // Sample on how to format PUT requests
    it("PUT test for courses dataset", function () {
        let ZIP_FILE_DATA = fs.readFileSync("./test/data/courses.zip");
        try {
            return chai.request(SERVER_URL)
                .put("/dataset/courses/courses")
                .send(ZIP_FILE_DATA)
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    expect(res.status).to.be.equal(200);
                    let data = res.body.result;
                    expect(data).to.deep.equal(["courses"]);
                })
                .catch(function (err) {
                    Log.trace("Error: " + err);
                    expect.fail();
                });
        } catch (err) {
            Log.trace("Error in PUT test: " + err);
            expect.fail();
        }
    });

    it("PUT test for rooms dataset", function () {
        let ZIP_FILE_DATA = fs.readFileSync("./test/data/rooms.zip");
        try {
            return chai.request(SERVER_URL)
                .put("/dataset/rooms/rooms")
                .send(ZIP_FILE_DATA)
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    expect(res.status).to.be.equal(200);
                    let data = res.body.result;
                    expect(data).to.deep.equal(["rooms"]);
                })
                .catch(function (err) {
                    Log.trace("Error: " + err);
                    expect.fail();
                });
        } catch (err) {
            Log.trace("Error in PUT test: " + err);
            expect.fail();
        }
    });

    it("PUT test for courses dataset with invalid ID", function () {
        let ZIP_FILE_DATA = fs.readFileSync("./test/data/courses.zip");
        try {
            return chai.request(SERVER_URL)
                .put("/dataset/courses/_courses")
                .send(ZIP_FILE_DATA)
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    expect.fail("Should not have fulfilled");
                })
                .catch(function (err) {
                    expect(err.response).to.have.status(400);
                });
        } catch (err) {
            Log.trace("Error in PUT test: " + err);
            expect.fail();
        }
    });

    it("PUT test for courses dataset with nonsense type", function () {
        let ZIP_FILE_DATA = fs.readFileSync("./test/data/courses.zip");
        try {
            return chai.request(SERVER_URL)
                .put("/dataset/course/_courses")
                .send(ZIP_FILE_DATA)
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    expect.fail("Should not have fulfilled");
                })
                .catch(function (err) {
                    expect(err.response).to.have.status(400);
                });
        } catch (err) {
            Log.trace("Error in PUT test: " + err);
            expect.fail();
        }
    });

    it("POST query test with valid query", () => {
        let ZIP_FILE_DATA = fs.readFileSync("./test/data/rooms.zip");

        try {
            return chai.request(SERVER_URL)
                .put("/dataset/rooms/rooms")
                .send(ZIP_FILE_DATA)
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    expect(res.status).to.be.equal(200);
                    let data = res.body.result;
                    expect(data).to.deep.equal(["rooms"]);
                    return chai.request(SERVER_URL)
                        .post("/query")
                        .set("Content-Type", "application/json")
                        .send(validQuery);
                })
                .then((res: Response) => {
                    expect(res.status).to.be.equal(200);
                    let data = res.body.result;
                    expect(data).to.deep.equal(validQueryExpected);
                })
                .catch(function (err) {
                    Log.trace("Error: " + err);
                    expect.fail();
                });
        } catch (err) {
            Log.trace("Error in PUT test: " + err);
            expect.fail();
        }
    });

    it("POST query test with valid query and server shuts down", () => {
        let ZIP_FILE_DATA = fs.readFileSync("./test/data/rooms.zip");
        try {
            return chai.request(SERVER_URL)
                .put("/dataset/rooms/rooms")
                .send(ZIP_FILE_DATA)
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    expect(res.status).to.be.equal(200);
                    let data = res.body.result;
                    expect(data).to.deep.equal(["rooms"]);
                    return chai.request(SERVER_URL)
                        .post("/query")
                        .set("Content-Type", "application/json")
                        .send(validQuery);
                })
                .then((res: Response) => {
                    expect(res.status).to.be.equal(200);
                    let data = res.body.result;
                    expect(data).to.deep.equal(validQueryExpected);
                    server.stop();
                })
                .then(() => {
                    server.start();
                })
                .then(() => {
                    return chai.request(SERVER_URL)
                        .post("/query")
                        .set("Content-Type", "application/json")
                        .send(validQuery);
                })
                .then((res: Response) => {
                    expect(res.status).to.be.equal(200);
                    let data = res.body.result;
                    expect(data).to.deep.equal(validQueryExpected);
                })
                .catch(function (err) {
                    Log.trace("Error: " + err);
                    expect.fail();
                });
        } catch (err) {
            Log.trace("Error in PUT test: " + err);
            expect.fail();
        }
    });

    it("Should fail on an invalid query", () => {
        let ZIP_FILE_DATA = fs.readFileSync("./test/data/courses.zip");
        return chai.request(SERVER_URL)
            .put("/dataset/courses/courses")
            .send(ZIP_FILE_DATA)
            .set("Content-Type", "application/x-zip-compressed")
            .then(function () {
                return chai.request(SERVER_URL)
                    .post("/query")
                    .set("Content-Type", "application/json")
                    .send(invalidQuery);
            })
            .then(() => {
                expect.fail("Should not have fulfilled");
            })
            .catch((err) => {
                Log.error(err);
                expect(err.response).to.have.status(400);
            });
    });

    it("Should delete added dataset courses.", () => {
        let ZIP_FILE_DATA = fs.readFileSync("./test/data/courses.zip");
        return chai.request(SERVER_URL)
            .put("/dataset/courses/courses")
            .send(ZIP_FILE_DATA)
            .set("Content-Type", "application/x-zip-compressed")
            .then(function () {
                return chai.request(SERVER_URL)
                    .del("/dataset/courses");
            })
            .then((res) => {
                Log.trace(res);
                expect(res.status).to.equal(200);
                expect(res.body.result).to.deep.equal("courses");
            })
            .catch((err) => {
                Log.error(err);
                expect.fail(err);
            });
    });

    it("GetStatic test - valid index", () => {
        return chai.request(SERVER_URL)
            .get("/")
            .then((res) => {
                expect(res.status).to.equal(200);
            }).catch((err) => {
                Log.error(err);
                expect.fail();
            });
    });

    it("GetStatic test - invalid file", () => {
        return chai.request(SERVER_URL)
            .get("/birbislovebirbislife")
            .then(() => {
                expect.fail();
            }).catch((err) => {
                expect(err.response).to.have.status(500);
            });
    });
});
