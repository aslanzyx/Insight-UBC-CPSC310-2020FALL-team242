import Server from "../src/rest/Server";
import fs = require("fs");

import InsightFacade from "../src/controller/InsightFacade";
import chai = require("chai");
import chaiHttp = require("chai-http");
import Response = ChaiHttp.Response;
import { expect } from "chai";
import Log from "../src/Util";

describe("Facade D3", function () {

    let facade: InsightFacade = null;
    let server: Server = null;

    chai.use(chaiHttp);

    before(function () {
        facade = new InsightFacade();
        server = new Server(4321);
        server.start();
    });

    after(function () {
        server.stop();
    });

    beforeEach(function () {
        // might want to add some process logging here to keep track of what"s going on
    });

    afterEach(function () {
        // might want to add some process logging here to keep track of what"s going on
    });

    // Sample on how to format PUT requests
    // it("PUT test for a dataset", function () {
    //     try {
    //         return chai.request("http://[::]:4321")
    //             .put("/dataset/courses/courses")
    //             .send("./test/data/courses.zip")
    //             .set("Content-Type", "application/x-zip-compressed")
    //             .then((res: Response) => {
    //                 expect(res.status).to.be.equal(200);
    //                 expect(res.body.result).to.be.deep.equals(["courses"]);
    //             })
    //             .catch((err) => {
    //                 expect.fail();
    //             });
    //     } catch (err) {
    //         // and some more logging here!
    //         Log.info("failed semantics");
    //     }
    // });

    // it("PUT test for an invalid duplicated dataset", function () {
    //     try {
    //         return chai.request("http://[::]:4321")
    //             .put("/dataset/courses/courses")
    //             .send("./test/data/courses.zip")
    //             .set("Content-Type", "application/x-zip-compressed")
    //             .then((res: Response) => {
    //                 expect.fail();
    //             })
    //             .catch((err) => {
    //                 expect(err.status).to.be.equal(400);
    //             });
    //     } catch (err) {
    //         Log.info("failed semantics");
    //     }
    // });

    // it("PUT test for an invalid dataset", function () {
    //     try {
    //         return chai.request("http://[::]:4321")
    //             .put("/dataset/courses_invalid/courses")
    //             .send("./test/data/courses.zip")
    //             .set("Content-Type", "application/x-zip-compressed")
    //             .then((res: Response) => {
    //                 expect.fail();
    //             })
    //             .catch((err) => {
    //                 expect(err.status).to.be.equal(400);
    //             });
    //     } catch (err) {
    //         Log.info("failed semantics");
    //     }
    // });

    // it("PUT test for another valid dataset", function () {
    //     try {
    //         return chai.request("http://[::]:4321")
    //             .put("/dataset/courses-copy/courses")
    //             .send("./test/data/courses-copy.zip")
    //             .set("Content-Type", "application/x-zip-compressed")
    //             .then((res: Response) => {
    //                 expect(res.status).to.be.equal(200);
    //                 expect(res.body.result).to.be.deep.equals(["courses", "courses-copy"]);
    //             })
    //             .catch((err) => {
    //                 expect.fail();
    //             });
    //     } catch (err) {
    //         Log.info("failed semantics");
    //     }
    // });

    // // The other endpoints work similarly. You should be able to find all instructions at the chai-http documentation
    // it("GET test for all datasets", function () {
    //     try {
    //         return chai.request("http://[::]:4321")
    //             .get("/datasets")
    //             .set("Content-Type", "application/x-zip-compressed")
    //             .then((res: Response) => {
    //                 expect(res.status).to.be.equal(200);
    //                 expect(res.body.result).to.be.deep
    //                     .equals([
    //                         { id: "courses", kind: "courses", numRows: 64612 },
    //                         { id: "courses-copy", kind: "courses", numRows: 64612 }]);
    //             })
    //             .catch((err) => {
    //                 expect.fail();
    //             });
    //     } catch (err) {
    //         Log.info("failed semantics");
    //     }
    // });

    // // it("POST test for a valid query", function () {
    // //     try {
    // //         let q = TestUtil.readTestQueries()[0];
    // //         return chai.request("http://[::]:4321")
    // //             .post("/query")
    // //             .send(q.query)
    // //             .then((res: Response) => {
    // //                 Log.info("success");
    // //                 expect(res.status).to.be.equal(200);
    // //                 expect(res.body.result).to.be.deep.equals(q.result);
    // //             })
    // //             .catch((err) => {
    // //                 // Log.info(err);
    // //                 expect.fail();
    // //             });
    // //     } catch (err) {
    // //         // and some more logging here!
    // //         Log.info("failed semantics");
    // //     }
    // // });

    // it("POST test for a invalid query", function () {
    //     try {
    //         let q = TestUtil.readTestQueries()[1];
    //         return chai.request("http://[::]:4321")
    //             .post("/query")
    //             .send(q.query)
    //             .then((res: Response) => {
    //                 expect.fail();
    //             })
    //             .catch((err) => {
    //                 expect(err.status).to.be.equal(400);
    //             });
    //     } catch (err) {
    //         Log.info("failed semantics");
    //     }
    // });

    // it("DELETE test for a invalid dataset 404", function () {
    //     try {
    //         return chai.request("http://[::]:4321")
    //             .del("/dataset/courses-not-exist")
    //             .then(function (res: Response) {
    //                 expect.fail();
    //             })
    //             .catch((err) => {
    //                 expect(err.status).to.be.equal(404);
    //             });
    //     } catch (err) {
    //         Log.info("failed semantics");
    //     }
    // });

    // it("DELETE test for a invalid dataset 400", function () {
    //     try {
    //         return chai.request("http://[::]:4321")
    //             .del("/dataset/")
    //             .then(function (res: Response) {
    //                 expect.fail();
    //             })
    //             .catch((err) => {
    //                 expect(err.status).to.be.equal(400);
    //             });
    //     } catch (err) {
    //         Log.info("failed semantics");
    //     }
    // });

    // it("DELETE test for a valid dataset", function () {
    //     try {
    //         return chai.request("http://[::]:4321")
    //             .del("/dataset/courses")
    //             .then((res: Response) => {
    //                 expect(res.status).to.be.equal(200);
    //                 expect(res.body.result).to.be.equal("courses");
    //             })
    //             .catch((err) => {
    //                 expect.fail();
    //             });
    //     } catch (err) {
    //         Log.info("failed semantics");
    //     }
    // });

    // it("DELETE test for an another valid dataset", function () {
    //     try {
    //         return chai.request("http://[::]:4321")
    //             .del("/dataset/courses-copy")
    //             .then((res: Response) => {
    //                 expect(res.status).to.be.equal(200);
    //                 expect(res.body.result).to.be.equal("courses-copy");
    //             })
    //             .catch((err) => {
    //                 expect.fail();
    //             });
    //     } catch (err) {
    //         Log.info("failed semantics");
    //     }
    // });

    it("PUT test for a rooms dataset", function () {
        try {
            let file = fs.readFileSync("./test/data/rooms.zip");
            return chai.request("http://[::]:4321")
                .put("/dataset/rooms/rooms")
                .send(file)
                .set("Content-Type", "application/x-zip-compressed")
                .then((res: Response) => {
                    expect(res.status).to.be.equal(200);
                    expect(res.body.result).to.be.deep.equals(["rooms"]);
                })
                .catch((err) => {
                    expect.fail();
                });
        } catch (err) {
            Log.info("failed semantics");
        }
    });

    it("PUT test for a courses dataset", function () {
        try {
            let file = fs.readFileSync("./test/data/courses.zip");
            return chai.request("http://[::]:4321")
                .put("/dataset/courses/courses")
                .send(file)
                .set("Content-Type", "application/x-zip-compressed")
                .then((res: Response) => {
                    expect(res.status).to.be.equal(200);
                    expect(res.body.result).to.be.deep.equals(["rooms", "courses"]);
                })
                .catch((err) => {
                    expect.fail();
                });
        } catch (err) {
            Log.info("failed semantics");
        }
    });

    it("PUT test for a dupliacted room dataset", function () {
        try {
            let file = fs.readFileSync("./test/data/rooms.zip");
            return chai.request("http://[::]:4321")
                .put("/dataset/rooms/rooms")
                .send(file)
                .set("Content-Type", "application/x-zip-compressed")
                .then((res: Response) => {
                    expect.fail();
                })
                .catch((err) => {
                    expect(err.status).to.be.equal(400);
                });
        } catch (err) {
            Log.info("failed semantics");
        }
    });

    it("PUT test for a invalid kind", function () {
        try {
            let file = fs.readFileSync("./test/data/rooms.zip");
            return chai.request("http://[::]:4321")
                .put("/dataset/rooms/halls")
                .send(file)
                .set("Content-Type", "application/x-zip-compressed")
                .then((res: Response) => {
                    expect.fail();
                })
                .catch((err) => {
                    expect(err.status).to.be.equal(400);
                });
        } catch (err) {
            Log.info("failed semantics");
        }
    });

    it("DELETE test for a valid dataset", function () {
        try {
            return chai.request("http://[::]:4321")
                .del("/dataset/courses")
                .then((res: Response) => {
                    expect(res.status).to.be.equal(200);
                    expect(res.body.result).to.be.equal("courses");
                })
                .catch((err) => {
                    expect.fail();
                });
        } catch (err) {
            Log.info("failed semantics");
        }
    });

    it("DELETE test for an another valid dataset", function () {
        try {
            return chai.request("http://[::]:4321")
                .del("/dataset/rooms")
                .then((res: Response) => {
                    expect(res.status).to.be.equal(200);
                    expect(res.body.result).to.be.equal("rooms");
                })
                .catch((err) => {
                    expect.fail();
                });
        } catch (err) {
            Log.info("failed semantics");
        }
    });

    it("DELETE test for an invalid dataset 404", function () {
        try {
            return chai.request("http://[::]:4321")
                .del("/dataset/rooms-no-exit")
                .then((res: Response) => {
                    expect.fail();
                })
                .catch((err) => {
                    expect(err.status).to.be.equal(404);
                });
        } catch (err) {
            Log.info("failed semantics");
        }
    });

    it("DELETE test for an invalid dataset 400", function () {
        try {
            return chai.request("http://[::]:4321")
                .del("/dataset/")
                .then((res: Response) => {
                    expect.fail();
                })
                .catch((err) => {
                    expect(err.status).to.be.equal(400);
                });
        } catch (err) {
            Log.info("failed semantics");
        }
    });

    it("DELETE test for an invalid dataset 400", function () {
        try {
            return chai.request("http://[::]:4321")
                .del("/dataset/room_1")
                .then((res: Response) => {
                    expect.fail();
                })
                .catch((err) => {
                    expect(err.status).to.be.equal(400);
                });
        } catch (err) {
            Log.info("failed semantics");
        }
    });

    // // cache a dataset for frontend debugging
    it("PUT test for a dataset", function () {
        let file = fs.readFileSync("./test/data/courses.zip");
        try {
            return chai.request("http://localhost:4321")
                .put("/dataset/courses/courses")
                .send(file)
                .set("Content-Type", "application/x-zip-compressed")
                .then((res: Response) => {
                    expect(res.status).to.be.equal(200);
                    expect(res.body.result).to.be.deep.equals(["courses"]);
                })
                .catch((err) => {
                    expect.fail();
                });
        } catch (err) {
            Log.info("failed semantics");
        }
    });

    it("PUT test for a dataset", function () {
        let file = fs.readFileSync("./test/data/rooms.zip");
        try {
            return chai.request("http://[::]:4321")
                .put("/dataset/rooms/rooms")
                .send(file)
                .set("Content-Type", "application/x-zip-compressed")
                .then((res: Response) => {
                    expect(res.status).to.be.equal(200);
                    expect(res.body.result).to.be.deep.equals(["courses", "rooms"]);
                })
                .catch((err) => {
                    expect.fail();
                });
        } catch (err) {
            Log.info("failed semantics");
        }
    });
});
