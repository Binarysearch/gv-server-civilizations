import { Controller, Post, Session, WsAuthService } from "@piros/tssf";
import { UsersDao } from "../dao/users-dao";
import { Observable, of, forkJoin, throwError } from "rxjs";
import { map, mergeMap } from "rxjs/operators";
import { UserCredentialsDto } from "../interface/dtos/user-credentials-dto";
import * as uuid from "uuid";

@Controller
export class UsersController {

    constructor(
        private usersDao: UsersDao
    ) { }

    @Post('register')
    public register(credentials: UserCredentialsDto): Observable<string> {
        return new Observable((obs) => {
            this.usersDao.getByUsername(credentials.username).subscribe(
                user => {
                    if (user) {
                        obs.error({ httpStatusCode: 409, description: 'User already exists' });
                    } else {
                        const userId = uuid.v4();
                        this.usersDao.saveUser({
                            id: userId,
                            username: credentials.username,
                            password: credentials.password
                        }).subscribe(() => {
                            obs.next(userId);
                        });
                    }
                }
            );
        });
    }
}