
import { Injectable } from "@piros/ioc";
import { Observable } from "rxjs";
import { DatabaseService } from "./database-service";

@Injectable
export class SessionsDao {

    constructor(
        private ds: DatabaseService
    ) {
        
    }

    public getByToken(authToken: string): Observable<{ authToken: string; userId: string }> {
        return this.ds.getOne<{ authToken: string; userId: string }>(
            `
            SELECT
                token as "authToken",
                "user" as "userId"
            FROM
                sessions
            WHERE 
                token = $1;
        `, [ authToken ]);
    }

    public saveSession(authToken: string, userId: string): Observable<void> {
        return this.ds.execute(`
        INSERT INTO sessions(token, "user") 
        VALUES ($1, $2)
        `,[ authToken, userId ]);
    }

}