import { Injectable } from "@piros/ioc";
import { Observable } from "rxjs";
import { Colony } from "../model/colony";
import { DatabaseService } from "@piros/gv-server-commons";

@Injectable
export class ColoniesDao {

    constructor(
        private ds: DatabaseService
    ) {
        
    }

    public getVisibleColonies(civilizationId: string): Observable<Colony[]> {
        return this.ds.getAll<Colony>(
            `
            SELECT
                c.id,
                c.civilization,
                c.planet
            FROM
                colonies c
                join planets p ON p.id = c.planet
                join visible_stars vs on vs.star = p.star and vs.civilization = $1 AND vs.quantity > 0;
        `, [ civilizationId ]);
    }

    public saveColonies(colonies: Colony[]): Observable<void> {
        
        const values = colonies.map(f => {
            return `('${f.id}', '${f.civilization}', '${f.planet}')`;
        }).join(',');

        const insertQuery = `
            INSERT INTO colonies(
                id,
                civilization,
                planet
            ) VALUES ${values};
        `;
        return this.ds.execute(insertQuery, []);
    }
    
}