import {IScheduler, SchedRoom, SchedSection, TimeSlot, SLOTS} from "./IScheduler";
import {SRoom} from "./SRoom";

export default class Scheduler implements IScheduler {

    private uuidSet: Set<string>;

    public schedule(sections: SchedSection[], rooms: SchedRoom[]): Array<[SchedRoom, SchedSection, TimeSlot]> {
        this.uuidSet = new Set();
        this.sortRoomsByCapacity(rooms);
        this.sortSectionsByEnrollment(sections);

        let srooms: SRoom[] = rooms.map((value) => new SRoom(value));
        this.calculateGreatestDistanceForAllRooms(srooms);

        return this.scheduleTimes(sections, srooms);
    }

    private sortRoomsByCapacity(rooms: SchedRoom[]) {
        rooms.sort((a, b) => {
            return a.rooms_seats - b.rooms_seats;
        });
    }

    private sortSectionsByEnrollment(sections: SchedSection[]) {
        sections.sort((a, b) => {
            let aEnrollment = a.courses_audit + a.courses_pass + a.courses_fail;
            let bEnrollment = b.courses_audit + b.courses_pass + b.courses_fail;

            return bEnrollment - aEnrollment;
        });
    }

    private calculateGreatestDistanceForAllRooms(rooms: SRoom[]) {
        for (let room of rooms) {
            room.calculateFurthestDistance(rooms);
        }
    }

    private scheduleTimes(sections: SchedSection[], rooms: SRoom[]): Array<[SchedRoom, SchedSection, TimeSlot]> {
        for (let section of sections) {
            let smallestRoomsPossible = this.findSmallestRoomsForSection(section, rooms);
            if (smallestRoomsPossible.length > 0) {
                this.scheduleTime(section, smallestRoomsPossible);
            }
        }

        let arr: Array<[SchedRoom, SchedSection, TimeSlot]> = [];

        for (let room of rooms) {
            arr = arr.concat(room.getAssignments());
        }

        return arr;
    }

    private scheduleTime(section: SchedSection, rooms: SRoom[]) {
        if (!this.uuidSet.has(section.courses_uuid)) {
            let smallest = rooms[0];
            let alternateRooms: SRoom[] = [];

            for (let i = 1 ; i < rooms.length; i++) {
                    if (!rooms[i].isFull() && rooms[i].getGreatestDistance() < smallest.getGreatestDistance()) {
                        alternateRooms.push(rooms[i]);
                    }
                }

            if (alternateRooms.length === 0) {
                smallest.assignSlot(section);
            } else {
                let bestSoFar: SRoom = alternateRooms[0];
                for (let room of alternateRooms) {
                    if (room.getGreatestDistance() <= bestSoFar.getGreatestDistance()) {
                        bestSoFar = room;
                    }
                }

                bestSoFar.assignSlot(section);
            }

            this.uuidSet.add(section.courses_uuid);
        }

    }

    private findSmallestRoomsForSection(section: SchedSection, rooms: SRoom[]): SRoom[] {
        let totalEnrollment: number = section.courses_audit + section.courses_pass + section.courses_fail;
        let startIndex = -1;

        for (let i = 0; i < rooms.length; i++) {
            let room = rooms[i];
            if (!room.isFull() && totalEnrollment <= room.seats) {
                startIndex = i;
                break;
            }
        }

        if (startIndex !== -1) {
            let srooms = Array.from(rooms).splice(startIndex);
            return srooms;
        } else {
            return [];
        }
    }

}
