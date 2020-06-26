import { Injectable } from "@piros/ioc";
import { Observable } from "rxjs";
import { Fleet } from "../model/fleet";
import { DatabaseService } from "@piros/gv-server-commons";

@Injectable
export class FleetsDao {

    constructor(
        private ds: DatabaseService
    ) {
        
    }

    public getFleetById(fleetId: string): Observable<Fleet> {
        return this.ds.getOne<Fleet>(
            `
            SELECT
                f.id,
                f.civilization as "civilizationId",
                f.origin as "originId",
                f.destination as "destinationId",
                f.start_travel_time as "startTravelTime",
                f.speed,
                f.seed,
                f.ship_count as "shipCount"
            FROM
                fleets f
            WHERE 
                id = $1;
        `, [ fleetId ]);
    }

    public getFleets(civilizationId: string): Observable<Fleet[]> {
        return this.ds.getAll<Fleet>(
            `
            SELECT
                f.id,
                f.civilization as "civilizationId",
                f.origin as "originId",
                f.destination as "destinationId",
                f.start_travel_time as "startTravelTime",
                f.speed,
                f.seed,
                f.ship_count as "shipCount"
            FROM
                fleets f
                join visible_stars vs on vs.star = f.destination and vs.civilization = $1 AND vs.quantity > 0;
        `, [ civilizationId ]);
    }

    public saveFleets(fleets: Fleet[]): Observable<void> {
        
        const values = fleets.map(f => {
            return `('${f.id}', '${f.civilizationId}', '${f.originId}', '${f.destinationId}', '${f.startTravelTime}', '${f.speed}', '${f.seed}', '${f.shipCount}')`;
        }).join(',');

        const insertQuery = `
            INSERT INTO fleets(
                id,
                civilization,
                origin,
                destination,
                start_travel_time,
                speed,
                seed,
                ship_count
            ) VALUES ${values};
        `;
        return this.ds.execute(insertQuery, []);
    }

    public updateFleet(f: Fleet): Observable<void> {
        const updateQuery = `
            UPDATE fleets SET
                civilization = $1,
                origin = $2,
                destination = $3,
                start_travel_time = $4,
                speed = $5,
                seed = $6,
                ship_count = $7
            WHERE
                id = $8;
        `;
        return this.ds.execute(updateQuery, [ f.civilizationId, f.originId, f.destinationId, f.startTravelTime, f.speed, f.seed, f.shipCount, f.id ]);
    }
    
}