import { Logger } from "@piros/tssf";
import { Observable, of, forkJoin, Subject, ReplaySubject } from "rxjs";
import { FleetsDao } from "../../dao/fleets-dao";
import { UserNotificationService } from "../../services/user-notification-service";
import { StarsDao } from "../../dao/stars-dao";
import { END_TRAVEL_NOTIFICATIONS_CHANNEL, VISIBILITY_GAIN_NOTIFICATIONS_CHANNEL, EXPLORE_STAR_NOTIFICATIONS_CHANNEL } from "../../channels";
import { EndTravelNotificationDto } from "../../interface/dtos/end-travel-notification-dto";
import { VisibilityGainedNotificationDto } from "../../interface/dtos/visibility-gained-notification";
import { ExploreStarNotificationDto } from "../../interface/dtos/explore-star-notification-dto";
import { Planet } from "../../model/planet";

import * as uuid from "uuid";
import { PlanetsDao } from "../../dao/planets-dao";
import { ColoniesDao } from "../../dao/colonies-dao";
import { Injectable } from "@piros/ioc";
import { FleetService } from "./fleets-service";

export interface EndTravelEvent {

    fleetId: string;
    originStarId: string;
    destinationStarId: string;
    userId: string;
    civilizationId: string;
    startTravelTime: number;
    travelTime: number;

}

@Injectable
export class EndTravelManagerService {

    private endTravelEventsSubject: Subject<EndTravelEvent> = new Subject();

    constructor(
        private fleetService: FleetService,
        private logger: Logger,
        private fleetsDao: FleetsDao,
        private starsDao: StarsDao,
        private planetsDao: PlanetsDao,
        private coloniesDao: ColoniesDao,
        private userNotificationService: UserNotificationService
    ) { }

    public startProcesingEvents(): void {
        this.fleetService.getStartTravelEvents().subscribe(
            startTravelEvent => {
                this.logger.log(`EndTravelManagerService -> Received start travel event.`);

                const {
                    fleetId,
                    destinationStarId,
                    userId,
                    civilizationId,
                    startTravelTime,
                    travelTime
                } = startTravelEvent;

                const now = Date.now();
                const elapsedTravelTime = now - startTravelTime;
                const remainingTravelTime = travelTime - elapsedTravelTime;

                setTimeout(() => {

                    this.fleetsDao.getFleetById(fleetId).subscribe(fleet => {
                        const endTravelNotification: EndTravelNotificationDto = {
                            fleet: {
                                ...fleet,
                                originId: destinationStarId,
                                destinationId: destinationStarId,
                                startTravelTime: 0
                            }
                        };

                        //enviar evento ganar visibilidad si no tenia visibilidad
                        this.starsDao.canCivilizationViewStar(civilizationId, destinationStarId).subscribe(canView => {
                            if (!canView) {
                                this.coloniesDao.getColoniesInStar(destinationStarId).subscribe(colonies => {
                                    const visibilityGainNotification: VisibilityGainedNotificationDto = {
                                        starId: destinationStarId,
                                        orbitingFleets: [],
                                        incomingFleets: [],
                                        colonies: colonies
                                    };
                                    this.userNotificationService.sendToUser(userId, VISIBILITY_GAIN_NOTIFICATIONS_CHANNEL, visibilityGainNotification);
                                });
                            }
                        });

                        //Crear planetas si no estaban creados
                        const planetsSubject: ReplaySubject<Planet[]> = new ReplaySubject();
                        this.starsDao.isExploredStar(destinationStarId).subscribe(explored =>{
                            if (!explored) {
                                const planets: Planet[] = [{
                                    id: uuid.v4(),
                                    starSystem: destinationStarId,
                                    type: 5,
                                    size: 4,
                                    orbit: 3
                                }];

                                forkJoin(
                                    this.planetsDao.savePlanets(planets),
                                    this.starsDao.markStarAsExplored(destinationStarId)
                                ).subscribe(() => {
                                    planetsSubject.next(planets);
                                    planetsSubject.complete();
                                });

                            } else {
                                this.planetsDao.getStarPlanets(destinationStarId).subscribe(planets => {
                                    planetsSubject.next(planets);
                                    planetsSubject.complete();
                                });
                            }
                        });
                        
                        //enviar evento explorar si no estaba explorado
                        this.starsDao.isExploredStarByCivilization(fleet.civilizationId, destinationStarId).subscribe(explored =>{
                            if (!explored) {
                                this.starsDao.saveKnownStars([{ starId: destinationStarId, civilizationId: fleet.civilizationId }]).subscribe(() => {
                                    planetsSubject.subscribe(planets => {
                                        const exploreStarNotification: ExploreStarNotificationDto = {
                                            starId: destinationStarId,
                                            planets: planets
                                        };
                                        this.userNotificationService.sendToUser(userId, EXPLORE_STAR_NOTIFICATIONS_CHANNEL, exploreStarNotification);
                                    });
                                });
                            }
                        });

                        forkJoin(
                            this.starsDao.addVisibilityToStar({ starId: destinationStarId, civilizationId: fleet.civilizationId, quantity: 1 }),
                            this.fleetsDao.updateFleet(endTravelNotification.fleet)
                        ).subscribe(() => {

                            this.starsDao.getViewerUserIdsInStars([destinationStarId]).subscribe(users =>{
                                users.forEach(u => {
                                    this.userNotificationService.sendToUser(u.userId, END_TRAVEL_NOTIFICATIONS_CHANNEL, endTravelNotification);
                                });
                            });

                        });
                    });
                    
                }, remainingTravelTime);
            }
        );
    }

    public getEndTravelEvents(): Observable<EndTravelEvent> {
        return this.endTravelEventsSubject.asObservable();
    }
}