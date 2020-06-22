import { Injectable } from "@piros/ioc";
import { Observable } from "rxjs";
import { Planet } from "../model/planet";
import { DatabaseService } from "@piros/gv-server-commons";

@Injectable
export class PlanetsDao {

    constructor(
        private ds: DatabaseService
    ) {
        
    }

    public getPlanets(civilizationId: string): Observable<Planet[]> {
        return this.ds.getAll<Planet>(
            `
            SELECT
                p.id,
                p.star_system as "starSystem",
                p.type,
                p.size,
                p.orbit
            FROM
                planets p
                join known_stars ks on ks.star = p.star_system and ks.civilization = $1;
        `, [ civilizationId ]);
    }

    public savePlanets(planets: Planet[]): Observable<void> {
        
        const values = planets.map(p => {
            return `('${p.id}', '${p.starSystem}', '${p.type}', '${p.size}', '${p.orbit}')`;
        }).join(',');

        const insertQuery = `
            INSERT INTO planets(
                id,
                star_system,
                type,
                size,
                orbit
            ) VALUES ${values};
        `;
        return this.ds.execute(insertQuery, []);
    }
    
}