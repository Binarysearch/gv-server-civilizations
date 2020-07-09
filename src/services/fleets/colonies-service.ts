import { Observable, forkJoin, Subject } from "rxjs";
import { FleetsDao } from "../../dao/fleets-dao";
import { Session } from "../../services/session";
import { UserNotificationService } from "../../services/user-notification-service";
import { StartTravelDto } from "../../interface/dtos/start-travel-dto";
import { StarsDao } from "../../dao/stars-dao";
import { Fleet } from "../../model/fleet";
import { Star } from "../../model/star";
import { INVALID_TRAVEL_ERROR } from "../../interface/errors/errors";
import { START_TRAVEL_NOTIFICATIONS_CHANNEL, DELETE_FLEET_NOTIFICATIONS_CHANNEL, CREATE_COLONY_NOTIFICATIONS_CHANNEL } from "../../channels";
import { StartTravelNotificationDto } from "../../interface/dtos/start-travel-notification-dto";
import { DeleteFleetNotificationDto } from "../../interface/dtos/delete-fleet-notification-dto";

import { Injectable } from "@piros/ioc";
import { Logger } from "@piros/tssf";
import { ColoniesDao } from "../../dao/colonies-dao";
import { ColonyDto } from "../../interface/dtos/colony-dto";
import { Colony } from "../../model/colony";

import * as uuid from "uuid";
import { PlanetsDao } from "../../dao/planets-dao";

export interface CreateColonyEvent {

    id: string;
    civilizationId: string;
    planetId: string;
    starId: string;
    userId: string;

}

@Injectable
export class ColoniesService {

    private createColonyEventsSubject: Subject<CreateColonyEvent> = new Subject();

    constructor(
        private coloniesDao: ColoniesDao,
        private starsDao: StarsDao,
        private planetsDao: PlanetsDao,
        private userNotificationService: UserNotificationService,
        private logger: Logger
    ) { }

    public createColony(session: Session, planetId: string): Observable<boolean> {
        return new Observable(obs => {
            const id = uuid.v4();
            forkJoin(
                this.coloniesDao.saveColonies([{
                    id: id,
                    civilization: session.civilizationId,
                    planet: planetId
                }]),
                this.planetsDao.getPlanetById(planetId)
            ).subscribe(results => {
                const planet = results[1];
                
                this.createColonyEventsSubject.next({
                    id: id,
                    civilizationId: session.civilizationId,
                    planetId: planetId,
                    userId: session.user.id,
                    starId: planet.starSystem
                });

                this.starsDao.getViewerUserIdsInStars([planet.starSystem]).subscribe(userIds => {
                    
                    let sentToUser = false;

                    const createColonyNotification: ColonyDto = {
                        id: id,
                        civilization: session.civilizationId,
                        planet: planetId
                    }

                    userIds.forEach(u => {
                        this.userNotificationService.sendToUser(u.userId, CREATE_COLONY_NOTIFICATIONS_CHANNEL, createColonyNotification);
                        if (u.userId === session.user.id) {
                            sentToUser = true;
                        }
                    });

                    if (!sentToUser) {
                        this.userNotificationService.sendToUser(session.user.id, CREATE_COLONY_NOTIFICATIONS_CHANNEL, createColonyNotification);
                    }
                });

                obs.next(true);
                obs.complete();
            });
        });
    }

    public getCreateColonyEvents(): Observable<CreateColonyEvent> {
        return this.createColonyEventsSubject.asObservable();
    }
    
    public getVisibleColonies(civilizationId: string): Observable<Colony[]> {
        return this.coloniesDao.getVisibleColonies(civilizationId);
    }

    public getColoniesInStar(starId: string): Observable<Colony[]> {
        return this.coloniesDao.getColoniesInStar(starId);
    }
}