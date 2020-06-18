import {IBuildingTopLevel} from "../model/Building";
import {Room} from "../model/Room";
import {InsightError} from "./IInsightFacade";
import {TableValidator} from "./TableValidator";
import {BuildingsParser} from "./BuildingsParser";


const ROOM_NUMBER = "views-field views-field-field-room-number";
const ROOM_CAPACITY = "views-field views-field-field-room-capacity";
const ROOM_FURNITURETYPE = "views-field views-field-field-room-furniture";
const ROOM_ROOMTYPE = "views-field views-field-field-room-type";
const ROOM_NOTHING = "views-field views-field-nothing";
export const ROOM_TABLE_CLASSES: Set<string> = new Set([ROOM_NUMBER, ROOM_CAPACITY,
    ROOM_FURNITURETYPE, ROOM_ROOMTYPE, ROOM_NOTHING]);

export class RoomsParser {
    public static parseRooms(table: any, buildingInfo: IBuildingTopLevel): Promise<Room[]> {
        return new Promise((resolve, reject) => {

            let tBody = TableValidator.getTBody(table);

            if (tBody === null) {
                resolve([]);
            }

            let promiseArray: Array<Promise<Room>> = [];
            for (let node of tBody.childNodes) {
                if (node.nodeName === "tr") {
                    promiseArray.push(RoomsParser.parseRoom(node, buildingInfo));
                }
            }

            Promise.all(promiseArray).then((result) => {
                let filteredResult = result.filter((room) => room !== undefined);
                resolve(filteredResult);
            }).catch((error) => {
                resolve([]);
            });
        });
    }

    private static parseRoom(tableRow: any, buildingInfo: IBuildingTopLevel): Promise<Room> {
        return new Promise((resolve, reject) => {
            let capacity: number;
            let roomNo: string;
            let href: string;
            let type: string;
            let furniture: string;
            for (let node of tableRow.childNodes) {
                if (node.nodeName === "td") {
                    for (let attr of node.attrs) {
                        let nodeValue: string;
                        if (attr.name === "class") {
                            nodeValue = attr.value;
                        }

                        switch (nodeValue) {
                            case ROOM_NUMBER:
                                let array = BuildingsParser.parseTitleAndURL(node);
                                href = array[0];
                                roomNo = array[1];
                                break;
                            case ROOM_ROOMTYPE:
                                type = BuildingsParser.parseTextNode(node);
                                break;
                            case ROOM_CAPACITY:
                                capacity = parseInt(node.childNodes[0].value.trim(), 10);
                                break;
                            case ROOM_FURNITURETYPE:
                                furniture = BuildingsParser.parseTextNode(node);
                                break;
                            default:
                                break;
                        }
                    }
                }
            }

            if (roomNo === undefined || href === undefined || type === undefined || furniture === undefined ||
                capacity === undefined ) {
                resolve(undefined);
            }

            if (isNaN(capacity)) {
                capacity = 0;
            }

            resolve(new Room(buildingInfo.title, buildingInfo.code, roomNo, buildingInfo.address, buildingInfo.lat,
                buildingInfo.lon, capacity, type, furniture, href));
        });
    }
}
