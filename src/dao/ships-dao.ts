import { Injectable } from "@piros/ioc";
import { Observable } from "rxjs";
import { Ship } from "../model/ship";
import { DatabaseService } from "@piros/gv-server-commons";

@Injectable
export class ShipsDao {

    constructor(
        private ds: DatabaseService
    ) {
        
    }

    public getFleetShips(fleetId: string): Observable<Ship[]> {
        return this.ds.getAll<Ship>(
            `
            SELECT
                s.id,
                s.fleet
            FROM
                ships s
            WHERE 
                fleet = $1;
        `, [ fleetId ]);
    }

    public saveShips(ships: Ship[]): Observable<void> {
        
        const values = ships.map(s => {
            return `('${s.id}', '${s.fleet}')`;
        }).join(',');

        const insertQuery = `
            INSERT INTO ships(
                id,
                fleet
            ) VALUES ${values};
        `;
        return this.ds.execute(insertQuery, []);
    }
    
}