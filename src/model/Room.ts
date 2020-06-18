import {Data} from "./Data";
import {ISection} from "./Section";

export interface IRoom {
    fullName: string;
    code: string;
    roomNo: string;
    address: string;
    lat: number;
    lon: number;
    seats: number;
    type: string;
    furniture: string;
    href: string;
}

export function isValidRoom(arg: any): arg is IRoom {
    return ((arg.fullName !== undefined) && (typeof arg.fullName === "string") &&
        (arg.code !== undefined) && (typeof arg.code === "string") &&
        (arg.roomNo !== undefined) && (typeof arg.roomNo === "string") &&
        (arg.address !== undefined) && (typeof arg.address === "string") &&
        (arg.lat !== undefined) && (typeof arg.lat === "number") &&
        (arg.lon !== undefined) && (typeof arg.lon === "number") &&
        (arg.seats !== undefined) && (typeof arg.seats === "number") &&
        (arg.type !== undefined) && (typeof arg.type === "string") &&
        (arg.furniture !== undefined) && (typeof arg.furniture === "string") &&
        (arg.href !== undefined) && (typeof arg.href === "string"));
}

export class Room extends Data {
    public static constructFromInterface(room: IRoom): Room {
        return new Room(room.fullName, room.code, room.roomNo, room.address, room.lat, room.lon, room.seats, room.type,
            room.furniture, room.href);
    }

    public returnResultObject(dataset: string): object {
        let res: any = {};

        if (dataset !== "") {
            res[dataset + "_fullname"] = this.fullName;
            res[dataset + "_shortname"] = this.code;
            res[dataset + "_number"] = this.roomNo;
            res[dataset + "_name"] = this.code + "_" + this.roomNo;
            res[dataset + "_address"] = this.address;
            res[dataset + "_lat"] = this.lat;
            res[dataset + "_lon"] = this.lon;
            res[dataset + "_seats"] = this.seats;
            res[dataset + "_type"] = this.type;
            res[dataset + "_furniture"] = this.furniture;
            res[dataset + "_href"] = this.href;
        } else {
            res["fullname"] = this.fullName;
            res["shortname"] = this.code;
            res["number"] = this.roomNo;
            res["name"] = this.code + "_" + this.roomNo;
            res["address"] = this.address;
            res["lat"] = this.lat;
            res["lon"] = this.lon;
            res["seats"] = this.seats;
            res["type"] = this.type;
            res["furniture"] = this.furniture;
            res["href"] = this.href;
        }


        return res;
    }


    public readonly fullName: string;
    public readonly code: string;
    public readonly roomNo: string;
    public readonly address: string;
    public readonly lat: number;
    public readonly lon: number;
    public readonly seats: number;
    public readonly type: string;
    public readonly furniture: string;
    public readonly href: string;

    constructor(fullName: string, code: string, roomNo: string, address: string, lat: number,
                lon: number, seats: number, type: string, furniture: string, href: string) {
        super();
        this.fullName = fullName;
        this.code = code;
        this.roomNo = roomNo;
        this.address = address;
        this.lat = lat;
        this.lon = lon;
        this.seats = seats;
        this.type = type;
        this.furniture = furniture;
        this.href = href;
    }

}
