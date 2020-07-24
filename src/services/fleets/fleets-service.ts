import { Observable, forkJoin, Subject } from "rxjs";
import { FleetsDao } from "../../dao/fleets-dao";
import { Session } from "../../services/session";
import { UserNotificationService } from "../../services/user-notification-service";
import { StartTravelDto } from "../../interface/dtos/start-travel-dto";
import { StarsDao } from "../../dao/stars-dao";
import { Fleet } from "../../model/fleet";
import { Star } from "../../model/star";
import { INVALID_TRAVEL_ERROR } from "../../interface/errors/errors";
import { START_TRAVEL_NOTIFICATIONS_CHANNEL, DELETE_FLEET_NOTIFICATIONS_CHANNEL, CIVILIZATION_MEET_NOTIFICATIONS_CHANNEL } from "../../channels";
import { StartTravelNotificationDto } from "../../interface/dtos/start-travel-notification-dto";
import { DeleteFleetNotificationDto } from "../../interface/dtos/delete-fleet-notification-dto";

import { Injectable } from "@piros/ioc";
import { Logger } from "@piros/tssf";
import { CivilizationsDao } from "../../dao/civilizations-dao";
import { CivilizationMeetNotificationDto } from "../../interface/dtos/civilization-meet-notification-dto";

export interface StartTravelEvent {

    fleetId: string;
    originStarId: string;
    destinationStarId: string;
    userId: string;
    civilizationId: string;
    startTravelTime: number;
    travelTime: number;

}

@Injectable
export class FleetService {

    private startTravelEventsSubject: Subject<StartTravelEvent> = new Subject();

    constructor(
        private fleetsDao: FleetsDao,
        private starsDao: StarsDao,
        private userNotificationService: UserNotificationService,
        private civilizationsDao: CivilizationsDao,
        private logger: Logger
    ) { }

    public startTravel(session: Session, dto: StartTravelDto): Observable<boolean> {
        return new Observable(obs => {
            forkJoin(
                this.fleetsDao.getFleetById(dto.fleetId),
                this.starsDao.getStarsByIds([dto.destinationStarId, dto.originStarId]),
            ).subscribe(results => {
                const fleet = results[0];
                const stars = results[1];

                if (!this.isValidTravel(dto, fleet, stars, session)) {
                    obs.error(INVALID_TRAVEL_ERROR);
                    return;
                }

                const startTravelTime = Date.now();
                
                const s1 = stars[0];
                const s2 = stars[1];
                const x = s1.x - s2.x;
                const y = s1.y - s2.y;
                const travelDistance = Math.sqrt(x*x + y*y);
                const travelTime = travelDistance / fleet.speed;

                const newFleet = {
                    ...fleet,
                    originId: fleet.destinationId,
                    destinationId: dto.destinationStarId,
                    startTravelTime: startTravelTime
                };

                this.fleetsDao.updateFleet(newFleet).subscribe(() => {

                    this.startTravelEventsSubject.next({
                        fleetId: dto.fleetId,
                        originStarId: dto.originStarId,
                        destinationStarId: dto.destinationStarId,
                        userId: session.user.id,
                        civilizationId: session.civilizationId,
                        startTravelTime: startTravelTime,
                        travelTime: travelTime
                    });
                    this.logger.log(`FleetService -> Sending start travel event.`);

                    const startTravelNotification: StartTravelNotificationDto = {
                        fleet: newFleet
                    };
                    const deleteFleetNotification: DeleteFleetNotificationDto = {
                        fleetId: newFleet.id
                    };
                    
                    forkJoin(
                        this.starsDao.getViewerUserIdsInStars([dto.originStarId]),
                        this.starsDao.getViewerUserIdsInStars([dto.destinationStarId])
                    ).subscribe(results => {
                        const usersPresentInOrigin = results[0];
                        const usersPresentInDestination = results[1];
                        const civilizationsToSendStartTravel = [...usersPresentInDestination];
                        const civilizationsToSendStartTravelSet: Set<string> = new Set();

                        civilizationsToSendStartTravel.forEach(u => {
                            civilizationsToSendStartTravelSet.add(u.userId);
                        });

                        if (!civilizationsToSendStartTravelSet.has(session.user.id)) {
                            civilizationsToSendStartTravel.push({ userId: session.user.id });
                            civilizationsToSendStartTravelSet.add(session.user.id);
                        }

                        //Enviar inicio viaje a los usuarios presentes en el sistema destino y al dueño
                        civilizationsToSendStartTravel.forEach(u => {
                            civilizationsToSendStartTravelSet.add(u.userId);
                            this.userNotificationService.sendToUser(u.userId, START_TRAVEL_NOTIFICATIONS_CHANNEL, startTravelNotification);
                        });

                        //Enviar borrado flota a los usuarios presentes en el sistema origen que no puedan ver el sistema destino
                        usersPresentInOrigin
                            .filter(u => !civilizationsToSendStartTravelSet.has(u.userId))
                            .forEach(u => {
                                this.userNotificationService.sendToUser(u.userId, DELETE_FLEET_NOTIFICATIONS_CHANNEL, deleteFleetNotification);
                            }
                        );
                        
                        // Para las civilizaciones presentes en el destino que no conozcan a la civilizacion dueña de la flota
                        // Enviar notificacion de encuentro de civilización 
                        this.starsDao.getUnknowerCivilizationsInStar(dto.destinationStarId, session.civilizationId).subscribe(civilizations => {
                            if (civilizations.length > 0) {

                                const newKnownCivilizations = civilizations.map(c => {
                                    return {
                                        known: session.civilizationId,
                                        knower: c.id
                                    };
                                });

                                this.civilizationsDao.saveKnownCivilizations(newKnownCivilizations).subscribe(() => {
                                    this.civilizationsDao.getById(session.civilizationId).subscribe(civ => {
                                        const civilizationMeetNotification: CivilizationMeetNotificationDto = {
                                            civilizations: [{ id: civ.id, name: civ.name }]
                                        }
    
                                        civilizations.forEach(c => {
                                            this.userNotificationService.sendToUser(c.user, CIVILIZATION_MEET_NOTIFICATIONS_CHANNEL, civilizationMeetNotification);
                                        });
                                    });
                                });

                                
                            }
                        });
                    });
                    
                    obs.next(true);
                    obs.complete();
                });
            });
        });
    }

    public getStartTravelEvents(): Observable<StartTravelEvent> {
        return this.startTravelEventsSubject.asObservable();
    }

    private isValidTravel(dto: StartTravelDto, fleet: Fleet, stars: Star[], session: Session): boolean {
        return true;
    }

    public getVisibleFleets(civilizationId: string): Observable<Fleet[]> {
        return this.fleetsDao.getVisibleFleets(civilizationId);
    }

    public getFleetsWithDestination(destinationStarId: string): Observable<Fleet[]> {
        return this.fleetsDao.getFleetsWithDestination(destinationStarId);
    }
}