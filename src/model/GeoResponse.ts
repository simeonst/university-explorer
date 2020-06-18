import * as http from "http";
import {InsightError} from "../controller/IInsightFacade";

export interface GeoResponse {
    lat?: number;
    lon?: number;
    error?: string;
}

export function isGeoResponse(object: any): object is GeoResponse {
    return ("lat" in object && "lon" in object && !("error" in object)) ||
        ("error" in object && !("lat" in object && "lon" in object));
}

export function getLatLon(address: string): Promise<GeoResponse> {
    return new Promise((resolve, reject) => {
        const URL = "http://cs310.students.cs.ubc.ca:11316/api/v1/project_team012/";
        let addressURL = encodeURI(address);


        let request = http.get(URL + addressURL, (response) => {
            if (response.statusCode !== 200) {
                reject(new InsightError("Error connecting to server"));
            }

            let rawData = "";
            response.on("data", (chunk) => {
                rawData += chunk;
            });
            response.on("end", () => {
                try {
                    const parsedData = JSON.parse(rawData);

                    if (isGeoResponse(parsedData)) {
                        resolve(parsedData);
                    } else {
                        throw new Error("Didn't receive a valid GeoResponse");
                    }

                } catch (e) {
                    reject(new InsightError(e.message));
                }
            });
        });

        request.setTimeout(10000, () => {
            reject(new InsightError("Timed out"));
        });
    });
}
