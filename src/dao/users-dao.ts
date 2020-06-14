import { Injectable } from "@piros/ioc";
import { Observable } from "rxjs";
import { User } from "../model/user";
import { DatabaseService } from "@piros/gv-server-commons";

@Injectable
export class UsersDao {

    constructor(
        private ds: DatabaseService
    ) {
        this.saveUser({
            id: 'admin_id',
            username: 'admin',
            password: '12345'
        }).subscribe();
    }

    public getById(id: string): Observable<User> {
        return this.ds.getOne<User>(
            `
            SELECT
                id,
                username,
                password
            FROM
                users
            WHERE 
                id = $1;
        `, [id]);
    }

    public getByUsername(username: string): Observable<User> {
        return this.ds.getOne<User>(
            `
            SELECT
                id,
                username,
                password
            FROM
                users
            WHERE 
                username = $1;
        `, [username]);
    }

    public saveUser(u: User): Observable<void> {
        return this.ds.execute(`
        INSERT INTO users(id, username, password) 
        VALUES ($1, $2, $3)
        `,[ u.id, u.username, u.password ]);
    }

}