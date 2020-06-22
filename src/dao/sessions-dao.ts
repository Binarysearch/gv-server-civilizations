
import { Injectable } from "@piros/ioc";
import { Observable } from "rxjs";
import { DatabaseService } from "@piros/gv-server-commons";

@Injectable
export class SessionsDao {

    constructor(
        private ds: DatabaseService
    ) {
        
    }

    public getByToken(authToken: string): Observable<{ authToken: string; userId: string, civilizationId: string }> {
        return this.ds.getOne<{ authToken: string; userId: string, civilizationId: string }>(
            `
            SELECT
                s.token as "authToken",
                s."user" as "userId",
                c.id as "civilizationId"
            FROM
                sessions s left join civilizations c on c."user" = s."user"
            WHERE 
                s.token = $1;
        `, [ authToken ]);
    }

    public saveSession(authToken: string, userId: string): Observable<void> {
        return this.ds.execute(`
        INSERT INTO sessions(token, "user") 
        VALUES ($1, $2)
        `,[ authToken, userId ]);
    }

}