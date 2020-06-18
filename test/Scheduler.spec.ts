import Scheduler from "../src/scheduler/Scheduler";
import Log from "../src/Util";
import {expect} from "chai";
import Haversine from "../src/scheduler/Haversine";
import {SRoom} from "../src/scheduler/SRoom";
import {GoodnessCalculator} from "../src/scheduler/GoodnessCalculator";
let aerl120 = {
    rooms_shortname: "AERL",
    rooms_number: "125",
    rooms_seats: 25,
    rooms_lat: 49.26372,
    rooms_lon: -123.25099
};

let anso = {
    rooms_shortname: "ANSO",
    rooms_number: "6969",
    rooms_seats: 21,
    rooms_lat: 49.26958,
    rooms_lon: -123.25741
};

let osbo = {
    rooms_shortname: "OSBO",
    rooms_number: "123A",
    rooms_seats: 35,
    rooms_lat: 49.26047,
    rooms_lon: -123.24467
};
describe("Scheduler tests", function ()  {
    let s: Scheduler;

    before(() => {
        Log.trace("Scheduler tests: before hook");
        s = new Scheduler();
    });

    it("Should return an empty array as a result if given empty input", function () {
        expect(s.schedule([], [])).to.deep.equal([]);
    });

    it("Should schedule a class when given a room that fits it", function () {
        let rooms = [
            {
                rooms_shortname: "AERL",
                rooms_number: "120",
                rooms_seats: 144,
                rooms_lat: 49.26372,
                rooms_lon: -123.25099
            }
        ];
        let classes = [
            {
                courses_dept: "cpsc",
                courses_id: "340",
                courses_uuid: "1319",
                courses_pass: 101,
                courses_fail: 7,
                courses_audit: 2
            }
        ];
        let expected = [
            [{
                rooms_shortname: "AERL",
                rooms_number: "120",
                rooms_seats: 144,
                rooms_lat: 49.26372,
                rooms_lon: -123.25099
            },
                {
                    courses_dept: "cpsc",
                    courses_id: "340",
                    courses_uuid: "1319",
                    courses_pass: 101,
                    courses_fail: 7,
                    courses_audit: 2
                }, "MWF 0800-0900"
            ]
        ];
        expect(s.schedule(classes, rooms)).to.deep.equal(expected);
    });

    it("Should not schedule a class when given a room that cannot fit it", function ()  {
        let rooms = [
            {
                rooms_shortname: "AERL",
                rooms_number: "120",
                rooms_seats: 99,
                rooms_lat: 49.26372,
                rooms_lon: -123.25099
            }
        ];
        let classes = [
            {
                courses_dept: "cpsc",
                courses_id: "340",
                courses_uuid: "1319",
                courses_pass: 101,
                courses_fail: 7,
                courses_audit: 2
            }
        ];
        expect(s.schedule(classes, rooms)).to.deep.equal([]);
    });

    it("Should schedule a class for the smallest room possible", function () {
        let rooms = [
            {
                rooms_shortname: "AERL",
                rooms_number: "120",
                rooms_seats: 144,
                rooms_lat: 49.26372,
                rooms_lon: -123.25099
            },
            {
                rooms_shortname: "AERL",
                rooms_number: "125",
                rooms_seats: 120,
                rooms_lat: 49.26372,
                rooms_lon: -123.25099
            }
        ];

        let classes = [
            {
                courses_dept: "cpsc",
                courses_id: "340",
                courses_uuid: "1319",
                courses_pass: 101,
                courses_fail: 7,
                courses_audit: 2
            }
        ];

        let expected = [
            [{
                rooms_shortname: "AERL",
                rooms_number: "125",
                rooms_seats: 120,
                rooms_lat: 49.26372,
                rooms_lon: -123.25099
            },
                {
                    courses_dept: "cpsc",
                    courses_id: "340",
                    courses_uuid: "1319",
                    courses_pass: 101,
                    courses_fail: 7,
                    courses_audit: 2
                }, "MWF 0800-0900"
            ]
        ];
        expect(s.schedule(classes, rooms)).to.deep.equal(expected);
    });

    it("Should only schedule classes that are possible to schedule when there are multiple", function () {
        let rooms = [
            {
                rooms_shortname: "AERL",
                rooms_number: "125",
                rooms_seats: 120,
                rooms_lat: 49.26372,
                rooms_lon: -123.25099
            }
        ];
        let classes = [
            {
                courses_dept: "cpsc",
                courses_id: "340",
                courses_uuid: "1319",
                courses_pass: 101,
                courses_fail: 7,
                courses_audit: 2
            },
            {
                courses_dept: "cpsc",
                courses_id: "350",
                courses_uuid: "1319",
                courses_pass: 200,
                courses_fail: 7,
                courses_audit: 2
            }
        ];
        let expected = [
            [{
                rooms_shortname: "AERL",
                rooms_number: "125",
                rooms_seats: 120,
                rooms_lat: 49.26372,
                rooms_lon: -123.25099
            },
                {
                    courses_dept: "cpsc",
                    courses_id: "340",
                    courses_uuid: "1319",
                    courses_pass: 101,
                    courses_fail: 7,
                    courses_audit: 2
                }, "MWF 0800-0900"
            ]
        ];
        expect(s.schedule(classes, rooms)).to.deep.equal(expected);
    });

    let expectedBiggerClass = [
        [{
            rooms_shortname: "AERL",
            rooms_number: "125",
            rooms_seats: 120,
            rooms_lat: 49.26372,
            rooms_lon: -123.25099
        },
            {
                courses_dept: "cpsc",
                courses_id: "436",
                courses_uuid: "1319",
                courses_pass: 100,
                courses_fail: 7,
                courses_audit: 2
            }, "MWF 0800-0900"
        ],
        [{
            rooms_shortname: "AERL",
            rooms_number: "125",
            rooms_seats: 120,
            rooms_lat: 49.26372,
            rooms_lon: -123.25099
        },
            {
                courses_dept: "phil",
                courses_id: "333",
                courses_uuid: "1321",
                courses_pass: 88,
                courses_fail: 0,
                courses_audit: 3
            },
            "MWF 0900-1000"
        ]
    ];

    it("Should schedule the bigger class in an earlier slot", function () {
        let rooms = [
            {
                rooms_shortname: "AERL",
                rooms_number: "125",
                rooms_seats: 120,
                rooms_lat: 49.26372,
                rooms_lon: -123.25099
            }
        ];
        let classes = [
            {
                courses_dept: "phil",
                courses_id: "333",
                courses_uuid: "1321",
                courses_pass: 88,
                courses_fail: 0,
                courses_audit: 3
            },
            {
                courses_dept: "cpsc",
                courses_id: "436",
                courses_uuid: "1319",
                courses_pass: 100,
                courses_fail: 7,
                courses_audit: 2
            }
        ];
        expect(s.schedule(classes, rooms)).to.deep.equal(expectedBiggerClass);

    });

    it("Should not schedule same class twice", () => {
            let rooms = [
                {
                    rooms_shortname: "AERL",
                    rooms_number: "125",
                    rooms_seats: 120,
                    rooms_lat: 49.26372,
                    rooms_lon: -123.25099
                }
            ];
            let classes = [
                {
                    courses_dept: "cpsc",
                    courses_id: "340",
                    courses_uuid: "1319",
                    courses_pass: 101,
                    courses_fail: 7,
                    courses_audit: 2
                },
                {
                    courses_dept: "cpsc",
                    courses_id: "320",
                    courses_uuid: "1319",
                    courses_pass: 99,
                    courses_fail: 3,
                    courses_audit: 55
                }
            ];
            let expected = [
                [{
                    rooms_shortname: "AERL",
                    rooms_number: "125",
                    rooms_seats: 120,
                    rooms_lat: 49.26372,
                    rooms_lon: -123.25099
                },
                    {
                        courses_dept: "cpsc",
                        courses_id: "340",
                        courses_uuid: "1319",
                        courses_pass: 101,
                        courses_fail: 7,
                        courses_audit: 2
                    }, "MWF 0800-0900"
                ]
            ];
            expect(s.schedule(classes, rooms)).to.deep.equal(expected);
        });

    let sectionsForGivenTest = [
        {
            courses_dept: "cpsc",
            courses_id: "340",
            courses_uuid: "1319",
            courses_pass: 101,
            courses_fail: 7,
            courses_audit: 2
        },
        {
            courses_dept: "cpsc",
            courses_id: "340",
            courses_uuid: "3397",
            courses_pass: 260,
            courses_fail: 3,
            courses_audit: 1
        },
        {
            courses_dept: "cpsc",
            courses_id: "344",
            courses_uuid: "62413",
            courses_pass: 93,
            courses_fail: 2,
            courses_audit: 0
        },
        {
            courses_dept: "cpsc",
            courses_id: "344",
            courses_uuid: "72385",
            courses_pass: 43,
            courses_fail: 1,
            courses_audit: 0
        }
    ];

    let roomsForGivenTest = [
        {
            rooms_shortname: "AERL",
            rooms_number: "120",
            rooms_seats: 144,
            rooms_lat: 49.26372,
            rooms_lon: -123.25099
        },
        {
            rooms_shortname: "ALRD",
            rooms_number: "105",
            rooms_seats: 94,
            rooms_lat: 49.2699,
            rooms_lon: -123.25318
        },
        {
            rooms_shortname: "ANGU",
            rooms_number: "098",
            rooms_seats: 260,
            rooms_lat: 49.26486,
            rooms_lon: -123.25364
        },
        {
            rooms_shortname: "BUCH",
            rooms_number: "A101",
            rooms_seats: 275,
            rooms_lat: 49.26826,
            rooms_lon: -123.25468
        }
    ];

    it("Given test", () => {
        let sRoomsForGivenTest = roomsForGivenTest.map((elem) => {
            return new SRoom(elem);
        });

        let goodness = GoodnessCalculator.calculateScore(sRoomsForGivenTest, sectionsForGivenTest,
            s.schedule(sectionsForGivenTest, roomsForGivenTest));

        expect(goodness).to.be.greaterThan(0.7);
    });

    it("Should schedule classes in AERL because of the improvement", () => {
        let rooms = [aerl120, osbo, anso];
        let courses = [
            {
                courses_dept: "phil",
                courses_id: "240",
                courses_uuid: "1279",
                courses_pass: 5,
                courses_fail: 0,
                courses_audit: 2
            }
        ];

        let expected = [
            [
                aerl120,
                {
                    courses_dept: "phil",
                    courses_id: "240",
                    courses_uuid: "1279",
                    courses_pass: 5,
                    courses_fail: 0,
                    courses_audit: 2
                },
                "MWF 0800-0900"
            ]
        ];

        expect(s.schedule(courses, rooms)).to.deep.equal(expected);
    });
});

describe("Haversine tests", () => {


    it("Should return a distance of 0 for the same room", () => {
        expect(Haversine.calculateDistanceBetweenRooms(new SRoom(aerl120), new SRoom(aerl120))).to.equal(0);
    });

    it("Should return 1372 for distance between OSBO and ANSO", () => {
        expect(Haversine.calculateDistanceBetweenRooms(new SRoom(osbo), new SRoom(anso))).to.equal(1372);
        expect(Haversine.calculateDistanceBetweenRooms(new SRoom(anso), new SRoom(osbo))).to.equal(1372);
    });

    it("Should return correct distance between AERL and OSBO", () => {
        expect(Haversine.calculateDistanceBetweenRooms(new SRoom(aerl120), new SRoom(osbo))).to.equal(584);
    });
});

describe("SRoom tests", () => {

    it("Should return greatest distance between OSBO, ANSO and AERL as 1372", () => {
        let sAnso = new SRoom(anso);
        let sOsbo = new SRoom(osbo);
        let sAerl = new SRoom(aerl120);

        let rooms = [sAnso, sOsbo, sAerl];

        sOsbo.calculateFurthestDistance(rooms);
        sAnso.calculateFurthestDistance(rooms);
        sAerl.calculateFurthestDistance(rooms);

        expect(sOsbo.getGreatestDistance()).to.equal(1372);
        expect(sAnso.getGreatestDistance()).to.equal(1372);
    });
});
