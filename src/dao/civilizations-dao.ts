import { Injectable } from "@piros/ioc";
import { Observable } from "rxjs";
import { Civilization } from "../model/civilization";
import { DatabaseService } from "@piros/gv-server-commons";

@Injectable
export class CivilizationsDao {

    constructor(
        private ds: DatabaseService
    ) {
        
    }

    public saveKnownCivilizations(knownCivilizations: { knower: string, known: string }[]): Observable<void> {

        const values = knownCivilizations.map(s => {
            return `('${s.knower}', '${s.known}')`;
        }).join(',');

        const insertQuery = `
            INSERT INTO known_civilizations(
                knower,
                known
            ) VALUES ${values};
        `;
        return this.ds.execute(insertQuery, []);
    }

    public getKnownCivilizationsBy(civilizationId: string): Observable<Civilization[]> {
        return this.ds.getAll<Civilization>(
            `
            SELECT
                c.id,
                c."user",
                c.name,
                c.homeworld
            FROM
                civilizations c JOIN known_civilizations kc ON kc.known = c.id AND kc.knower = $1
        `, [ civilizationId ]);
    }

    public getById(id: string): Observable<Civilization> {
        return this.ds.getOne<Civilization>(
            `
            SELECT
                id,
                "user",
                name,
                homeworld
            FROM
                civilizations
            WHERE 
                id = $1;
        `, [ id ]);
    }

    public getByUserId(userId: string): Observable<Civilization> {
        return this.ds.getOne<Civilization>(
            `
            SELECT
                id,
                "user",
                name,
                homeworld
            FROM
                civilizations
            WHERE 
                "user" = $1;
        `, [ userId ]);
    }

    public createCivilization(c: Civilization): Observable<void> {
        return this.ds.execute(`
        INSERT INTO civilizations(id, "user", name, homeworld) 
        VALUES ($1, $2, $3, $4)
        `,[ c.id, c.user, c.name, c.homeworld ]);
    }
}