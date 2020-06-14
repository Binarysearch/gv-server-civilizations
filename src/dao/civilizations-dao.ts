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

    public getByUserId(userId: string): Observable<Civilization> {
        return this.ds.getOne<Civilization>(
            `
            SELECT
                id,
                "user",
                name
            FROM
                civilizations
            WHERE 
                "user" = $1;
        `, [ userId ]);
    }

    public createCivilization(c: Civilization): Observable<void> {
        return this.ds.execute(`
        INSERT INTO civilizations(id, "user", name) 
        VALUES ($1, $2, $3)
        `,[ c.id, c.user, c.name ]);
    }
}