import { Injectable } from "@piros/ioc";
import { WsAuthService } from "@piros/tssf";
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import * as uuid from 'uuid';
import { UsersDao } from "../dao/users-dao";
import { SessionsDao } from "../dao/sessions-dao";
import { Session } from "./session";

@Injectable
export class LocalAuthService extends WsAuthService {

    constructor(
        private usersDao: UsersDao,
        private sessionsDao: SessionsDao
    ) {
        super();
    }

    public authWithToken(authToken: string): Observable<Session> {
        return this.sessionsDao.getByToken(authToken).pipe(
            map((session) => {
                return {
                    id: uuid.v4(),
                    authToken: authToken,
                    user: { id: session.userId },
                    civilizationId: session.civilizationId
                }
            })
        );
    }
    
    public login(username: string, password: string, authToken: string): Observable<Session> {
        return new Observable(obs => {
            this.usersDao.getByUsername(username).subscribe(user => {
                if (user && user.password === password) {
                    this.sessionsDao.saveSession(authToken, user.id).subscribe(
                        () => {
                            obs.next({
                                id: uuid.v4(),
                                authToken: authToken,
                                user: { id: user.id },
                                civilizationId: user.civilizationId
                            });
                            obs.complete();
                        }
                    );
                } else {
                    obs.error('Invalid credentials');
                }
            });
        });
    }
    
}