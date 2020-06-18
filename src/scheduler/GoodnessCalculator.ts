import {SRoom} from "./SRoom";
import {SchedRoom, SchedSection, TimeSlot} from "./IScheduler";

export class GoodnessCalculator {
    public static calculateScore(rooms: SRoom[], sections: SchedSection[],
                                 solution: Array<[SchedRoom, SchedSection, TimeSlot]>): number {
        let scheduledEnrollment = GoodnessCalculator.calculateScheduledEnrollment(sections);
        let totalEnrollment = GoodnessCalculator.calculateTotalEnrollment(solution);

        let maxDistance = GoodnessCalculator.getMaxDistance(solution, rooms);

        const E = scheduledEnrollment / totalEnrollment;
        const D = maxDistance / 1372;

        return ((0.7 * E) + (0.3 * (1 - D)));
    }

    private static getMaxDistance(solution: Array<[SchedRoom, SchedSection, TimeSlot]>, rooms: SRoom[]): number {
        let max = -1;

        for (let sol of solution) {
            let room = sol[0];

            let sroom = new SRoom(room);
            sroom.calculateFurthestDistance(rooms);

            max = Math.max(max, sroom.getGreatestDistance());
        }

        return max;
    }

    private static calculateScheduledEnrollment(sections: SchedSection[]): number {
        let total: number = 0;

        for (let section of sections) {
            total += (section.courses_fail + section.courses_audit + section.courses_pass);
        }

        return total;
    }

    private static calculateTotalEnrollment(solution: Array<[SchedRoom, SchedSection, TimeSlot]>): number {
        let total: number = 0;

        for (let sched of solution) {
            let sec = sched[1];

            total += (sec.courses_fail + sec.courses_audit + sec.courses_pass);
        }
        return total;
    }


}
