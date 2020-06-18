import {SRoom} from "./SRoom";

export default class Haversine {
    // Formula taken from https://tinyurl.com/y9xpn3vg
    public static calculateDistanceBetweenRooms(r1: SRoom, r2: SRoom): number {
        let lat1 = r1.lat;
        let lat2 = r2.lat;

        let lon1 = r1.lon;
        let lon2 = r2.lon;

        const R = 6371000; // Radius of the earth in km
        let dLat = Haversine.deg2rad(lat2 - lat1);  // deg2rad below
        let dLon = Haversine.deg2rad(lon2 - lon1);
        let a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(Haversine.deg2rad(lat1)) * Math.cos(Haversine.deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2)
        ;
        let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return Math.ceil((R * c));
    }

    private static deg2rad(deg: number): number {
        return deg * (Math.PI / 180);
    }
}
