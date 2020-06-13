import { Injectable } from "@piros/ioc";
import { Client, ClientConfig, QueryResult } from "pg";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

@Injectable
export class DatabaseService {

    private postgresClient: Client;


    constructor() {
        const config: ClientConfig = {
            user: process.env.POSTGRES_USERNAME,
            database: process.env.POSTGRES_DATABASE,
            password: process.env.POSTGRES_PASSWORD,
            port: <any>process.env.POSTGRES_PORT,
            host: process.env.POSTGRES_HOST
        };

        this.postgresClient = new Client(config);

        this.postgresClient.connect();
    }

    public query<T>(sqlQuery: string, values: any[]): Observable<QueryResult<T>> {
        return new Observable<QueryResult<T>>((obs) => {
            this.postgresClient.query(sqlQuery, values, (err, res) => {
                if (err) {
                    console.error(err);
                    obs.error(err);
                } else {
                    obs.next(res);
                    obs.complete();
                }
            });
        });
    }

    public getAll<T>(sqlQuery: string, values: any[]): Observable<T[]> {
        return new Observable<T[]>((obs) => {
            this.postgresClient.query(sqlQuery, values, (err, res) => {
                if (err) {
                    console.error(err);
                    obs.error(err);
                } else {
                    obs.next(res.rows);
                    obs.complete();
                }
            });
        });
    }

    public execute(sqlQuery: string, values: any[]): Observable<void> {
        return new Observable<void>((obs) => {
            this.postgresClient.query(sqlQuery, values, (err, res) => {
                if (err) {
                    console.error(err);
                    obs.error(err);
                } else {
                    obs.next();
                    obs.complete();
                }
            });
        });
    }

    public getOne<T>(sqlQuery: string, values: any[]): Observable<T> {
        return this.query<T>(sqlQuery, values).pipe(
            map(r => r.rows[0])
        );
    }

}