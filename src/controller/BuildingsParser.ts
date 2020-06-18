import Dataset from "../model/Dataset";
import {InsightDatasetKind, InsightError} from "./IInsightFacade";
import * as JSZip from "jszip";
import {Room} from "../model/Room";
import {GeoResponse, getLatLon, isGeoResponse} from "../model/GeoResponse";
import {IBuildingTopLevel} from "../model/Building";
import {ROOM_TABLE_CLASSES, RoomsParser} from "./RoomsParser";
import {TableValidator} from "./TableValidator";

const BUILDING_IMAGE = "views-field views-field-field-building-image";
const BUILDING_CODE = "views-field views-field-field-building-code";
const BUILDING_TITLE = "views-field views-field-title";
const BUILDING_ADDRESS = "views-field views-field-field-building-address";
const BUILDING_NOTHING =  "views-field views-field-nothing";
export const BUILDING_TABLE_CLASSES: Set<string> = new Set([BUILDING_IMAGE, BUILDING_CODE, BUILDING_TITLE,
    BUILDING_ADDRESS,
    BUILDING_NOTHING]);

export class BuildingsParser {
    private static zip: JSZip;

    public static parseRoomsZipFile(id: string, content: string): Promise<Dataset> {
        return new Promise((resolve, reject) => {
            let d = new Dataset(id, InsightDatasetKind.Rooms);
            BuildingsParser.zip = new JSZip();

            BuildingsParser.zip.loadAsync(content, {base64: true}).then((newZip) => {
                let dir = newZip.folder("rooms");

                let indexHtm = dir.file("index.htm");

                if (indexHtm !== null) {
                    indexHtm.async("text").then((result) => {

                        return BuildingsParser.parseIndexHtm(result);
                    }).then((rooms) => {
                        for (let room of rooms) {
                            d.addData(room);
                        }

                        if (d.getNumberOfRows() > 0) {
                            resolve(d);
                        } else {
                            reject(new InsightError("No rooms found in dataset"));
                        }
                    }).catch((error) => {
                        if (error instanceof InsightError) {
                            reject(error);
                        } else {
                            reject(new InsightError(error));
                        }
                    });
                } else {
                    reject(new InsightError("No index.htm found"));
                }

            });
        });
    }

    private static parseIndexHtm(index: string): Promise<Room[]> {
        return new Promise((resolve, reject) => {
            let parse5 = require("parse5");
            let json = parse5.parse(index);
            let tables = BuildingsParser.getTablesFromElement(json);
            let validTable: any = null;

            for (let table of tables) {
                if (TableValidator.isValidTable(table, false)) {
                    validTable = table;
                    break;
                }
            }

            if (validTable === null) {
                throw new InsightError("No valid table found");
            }

            this.parseTable(validTable).then((result) => {
                resolve(result);
            });
        });
    }


    private static getTablesFromElement(elem: any): any[] {
        if (elem.childNodes === undefined) {
            return [];
        }

        let tables: any[] = [];

        for (let node of elem.childNodes) {

            if (node.nodeName === "table") {
                return [node];
            }

            tables = tables.concat(this.getTablesFromElement(node));
        }

        return tables;
    }

    private static parseTable(table: any): Promise<Room[]> {
        return new Promise((resolve, reject) => {
            let tBody = TableValidator.getTBody(table);

            if (tBody === null) {
                reject(new InsightError("No table body found"));
            }

            let promiseArray: Array<Promise<any[]>> = [];
            for (let node of tBody.childNodes) {
                if (node.nodeName === "tr") {
                    promiseArray.push(BuildingsParser.parseBuilding(node));
                }
            }

            Promise.all(promiseArray).then((result) => {
                let retVal: Room[] = [];

                for (let array of result) {
                    retVal = retVal.concat(array);
                }
                resolve(retVal);
            });
        });
    }

    private static parseBuilding(tableRow: any): Promise<Room[]> {

        return new Promise((resolve, reject) => {
            BuildingsParser.parseBuildingTopLevel(tableRow).then((topLevel) => {
                if (topLevel === undefined) {
                    resolve([]);
                }

                BuildingsParser.loadHtml(topLevel).then((html) => {
                    let parse5 = require("parse5");

                    let json = parse5.parse(html);

                    let tables = BuildingsParser.getTablesFromElement(json);
                    let validTable: any = null;

                    for (let table of tables) {
                        if (TableValidator.isValidTable(table, true)) {
                            validTable = table;
                            break;
                        }
                    }

                    if (validTable === null) {
                        resolve([]);
                    }

                    return RoomsParser.parseRooms(validTable, topLevel);
                }).then((rooms) => {
                    resolve(rooms);
                }).catch((err) => {
                    resolve([]);
                });
            });
        });
    }

    private static loadHtml(topLevel: IBuildingTopLevel): Promise<string> {
        return new Promise((resolve, reject) => {
            let file = BuildingsParser.zip.file(topLevel.uri);

            if (file === null) {
                reject(new InsightError("Cannot find file"));
                return;
            }

            file.async("text").then((result) => {
                resolve(result);
            });
        });
    }

    private static parseBuildingTopLevel(tableRow: any): Promise<IBuildingTopLevel> {
        return new Promise((resolve, reject) => {
            let code: string, title: string, address: string, url: string;

            for (let node of tableRow.childNodes) {
                if (node.nodeName === "td") {
                    for (let attr of node.attrs) {
                        let nodeValue: string;

                        if (attr.name === "class") {
                            nodeValue = attr.value;
                        }
                        switch (nodeValue) {
                            case BUILDING_CODE:
                                code = this.parseTextNode(node);
                                break;
                            case BUILDING_TITLE:
                                let titleAndURL = BuildingsParser.parseTitleAndURL(node);
                                url = titleAndURL[0].replace(".", "rooms").trim();
                                title = titleAndURL[1].trim();
                                break;
                            case BUILDING_ADDRESS:
                                address = this.parseTextNode(node);
                                break;
                            default:
                                break;
                        }
                    }

                }
            }

            if (code === undefined || title === undefined || address === undefined || url === undefined) {
                resolve(undefined);
            }

            getLatLon(address).then((result) => {
                if (Object.keys(result).length === 1) {
                    resolve(undefined);
                }
                let topLevel: IBuildingTopLevel = {
                    lat: result.lat, lon: result.lon, code: code, title: title, uri: url, address: address
                };

                resolve(topLevel);
            }).catch((error) => {
                resolve(undefined);
            });
        });
    }

    public static parseTextNode(node: any): string {
        for (let child of node.childNodes) {
            if (child.nodeName === "#text") {
                return child.value.trim();
            }
        }

        return "";
    }

    public static parseTitleAndURL(td: any): string[] {
        let urlNode = null;
        for (let node of td.childNodes) {
            if (node.nodeName === "a") {
                urlNode = node;
                break;
            }
        }

        let url, title: string;

        for (let attr of urlNode.attrs) {
            if (attr.name === "href") {
                url = attr.value;
                break;
            }
        }

        title = this.parseTextNode(urlNode);

        return [url, title];
    }
}
