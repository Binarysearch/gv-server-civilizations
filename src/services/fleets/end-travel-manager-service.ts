import { Observable, forkJoin, Subject, ReplaySubject } from "rxjs";
import { FleetsDao } from "../../dao/fleets-dao";
import { UserNotificationService } from "../../services/user-notification-service";
import { StarsDao } from "../../dao/stars-dao";
import { END_TRAVEL_NOTIFICATIONS_CHANNEL, EXPLORE_STAR_NOTIFICATIONS_CHANNEL, CIVILIZATION_MEET_NOTIFICATIONS_CHANNEL } from "../../channels";
import { EndTravelNotificationDto } from "../../interface/dtos/end-travel-notification-dto";
import { ExploreStarNotificationDto } from "../../interface/dtos/explore-star-notification-dto";
import { Planet } from "../../model/planet";

import * as uuid from "uuid";
import { PlanetsDao } from "../../dao/planets-dao";
import { Injectable } from "@piros/ioc";
import { FleetService } from "./fleets-service";
import { clearTimeout } from "timers";
import { CivilizationMeetNotificationDto } from "../../interface/dtos/civilization-meet-notification-dto";

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

    private timeouts: NodeJS.Timeout[] = [];

    private endTravelEventsSubject: Subject<EndTravelEvent> = new Subject();

    constructor(
        private fleetService: FleetService,
        private fleetsDao: FleetsDao,
        private starsDao: StarsDao,
        private planetsDao: PlanetsDao,
        private userNotificationService: UserNotificationService,
    ) { }

    public startProcesingEvents(): void {
        this.fleetService.getStartTravelEvents().subscribe(
            startTravelEvent => {

                const {
                    fleetId,
                    destinationStarId,
                    userId,
                    startTravelTime,
                    travelTime
                } = startTravelEvent;

                const now = Date.now();
                const elapsedTravelTime = now - startTravelTime;
                const remainingTravelTime = travelTime - elapsedTravelTime;

                this.setTimeout(() => {

                    this.fleetsDao.getFleetById(fleetId).subscribe(fleet => {
                        const endTravelNotification: EndTravelNotificationDto = {
                            fleet: {
                                ...fleet,
                                originId: destinationStarId,
                                destinationId: destinationStarId,
                                startTravelTime: 0
                            }
                        };

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
                            this.fleetsDao.updateFleet(endTravelNotification.fleet),
                            this.starsDao.getViewerUserIdsInStars([destinationStarId])
                        ).subscribe(results => {

                            const usersPresentInDestination = results[1];
                            if (!usersPresentInDestination.find(u => u.userId === userId)) {
                                usersPresentInDestination.push({ userId: userId });
                            }

                            usersPresentInDestination.forEach(u => {
                                this.userNotificationService.sendToUser(u.userId, END_TRAVEL_NOTIFICATIONS_CHANNEL, endTravelNotification);
                            });

                            this.endTravelEventsSubject.next(startTravelEvent);
                        });
                        
                        // Si hay una civilización desconocida presente en el destino
                        // Enviar notificacion de encuentro de civilización a la civilización dueña de la flota
                        this.starsDao.getUnknownCivilizationsInStar(destinationStarId, startTravelEvent.civilizationId).subscribe(civilizations => {
                            if (civilizations.length > 0) {
                                const civilizationMeetNotification: CivilizationMeetNotificationDto = {
                                    civilizations: civilizations.map(c => ({ id: c.id, name: c.name }))
                                }

                                this.userNotificationService.sendToUser(startTravelEvent.userId, CIVILIZATION_MEET_NOTIFICATIONS_CHANNEL, civilizationMeetNotification);
                            }
                        });
                    });
                    
                }, remainingTravelTime);
            }
        );
    }

    setTimeout(callback: () => void, remainingTravelTime: number) {
        this.timeouts.push(setTimeout(callback, remainingTravelTime));
    }

    // TODO: Eliminar, esto es para testing
    clearState() {
        this.timeouts.forEach((t) => {
            clearTimeout(t);
        });
    }

    public getEndTravelEvents(): Observable<EndTravelEvent> {
        return this.endTravelEventsSubject.asObservable();
    }
}