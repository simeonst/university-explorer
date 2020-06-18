import {ROOM_TABLE_CLASSES} from "./RoomsParser";
import {BUILDING_TABLE_CLASSES} from "./BuildingsParser";

export class TableValidator {
    public static isValidTable(table: any, isForRoom: boolean): boolean {
        let childNodes = table.childNodes;
        let theader: any = null;

        for (let node of childNodes) {
            if (node.nodeName === "thead") {
                theader = node;
                break;
            }
        }

        if (theader === null) {
            return false;
        }

        return this.validateTableHeader(theader, isForRoom);
    }

    private static validateTableHeader(header: any, isForRoom: boolean) {
        let childNodes = header.childNodes;

        let tr = null;

        for (let node of childNodes) {
            if (node.nodeName === "tr") {
                tr = node;
                break;
            }
        }

        if (tr === null) {
            return false;
        }

        return this.validateHeaderTableRow(tr, isForRoom);
    }

    private static validateHeaderTableRow(row: any, isForRoom: boolean): boolean {
        let childNodes = row.childNodes;
        let set = (isForRoom ? ROOM_TABLE_CLASSES : BUILDING_TABLE_CLASSES);
        let trSet = new Set([]);

        for (let node of childNodes) {
            if (node.nodeName === "th") {
                let attrs = node.attrs;

                for (let attr of attrs) {
                    if (attr.name === "class" && set.has(attr.value) && !trSet.has(attr.value)) {
                        trSet.add(attr.value);
                    } else if (trSet.has(attr.value)) {
                        return false;
                    }
                }
            }
        }

        return trSet.size === 5;
    }

    public static getTBody(table: any): any | null {
        if (table !== null) {
            for (let node of table.childNodes) {
                if (node.nodeName === "tbody") {
                    return node;
                }
            }
        }

        return null;
    }
}
