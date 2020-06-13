import { Controller, Post, Session, WsAuthService } from "@piros/tssf";
import { UsersDao } from "../dao/users-dao";
import { Observable, of, forkJoin, throwError } from "rxjs";
import { map, mergeMap } from "rxjs/operators";
import { UserCredentialsDto } from "../interface/dtos/user-credentials-dto";
import * as uuid from "uuid";
import { SessionsDao } from "../dao/sessions-dao";

@Controller
export class UsersController {

    constructor(
        private usersDao: UsersDao,
        private sessionsDao: SessionsDao
    ) { }

    @Post('login-with-token')
    public loginWithToken(credentials: { authToken: string; }): Observable<string> {
        return this.sessionsDao.getByToken(credentials.authToken).pipe(
            map((session) => {
                return session.userId;
            })
        );
    }

    @Post('login')
    public login(credentials: { username: string; password: string; authToken: string; }): Observable<string> {
        return new Observable((obs) => {
            this.usersDao.getByUsername(credentials.username).subscribe(
                user => {
                    if (user && user.password === credentials.password) {
                        obs.next(user.id);
                        obs.complete();
                    } else {
                        obs.error({ httpStatusCode: 401, description: 'Invalid credentials' });
                    }
                }
            );
        });
    }

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