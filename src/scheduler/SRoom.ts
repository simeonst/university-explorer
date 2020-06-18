import {SchedRoom, SchedSection, SLOTS, TimeSlot} from "./IScheduler";
import Haversine from "./Haversine";

export class SRoom {
    public lat: number;
    public lon: number;
    public number: string;
    public seats: number;
    public shortname: string;
    private schedRoom: SchedRoom;
    private greatestDistance: number;
    private assignmentMap: Map<TimeSlot, SchedSection>;

    constructor(schedroom: SchedRoom) {
        this.greatestDistance = -1;
        this.lat = schedroom.rooms_lat;
        this.lon = schedroom.rooms_lon;
        this.number = schedroom.rooms_number;
        this.seats = schedroom.rooms_seats;
        this.shortname = schedroom.rooms_shortname;
        this.schedRoom = schedroom;
        this.assignmentMap = new Map();
    }

    public assignSlot(section: SchedSection) {
        if (!this.isFull()) {
            for (let time of SLOTS) {
                if (!this.assignmentMap.has(time)) {
                    this.assignmentMap.set(time, section);
                    break;
                }
            }
        }
    }

    public isFull(): boolean {
        return this.assignmentMap.size >= 15;
    }

    public getAvailableTimeSlot() {
        return this.assignmentMap.size;
    }

    public getAssignments(): Array<[SchedRoom, SchedSection, TimeSlot]> {
        let arr: Array<[SchedRoom, SchedSection, TimeSlot]> = [];
        for (let key of this.assignmentMap.keys()) {
            arr.push([this.schedRoom, this.assignmentMap.get(key), key]);
        }
        return arr;
    }

    public getGreatestDistance(): number {
        return this.greatestDistance;
    }

    public calculateFurthestDistance(rooms: SRoom[]): void {
        if (this.greatestDistance === - 1) {
            for (let room of rooms) {
                this.greatestDistance = Math.max(this.greatestDistance, Haversine.calculateDistanceBetweenRooms
                    (this, room));
            }
        }
    }
}
