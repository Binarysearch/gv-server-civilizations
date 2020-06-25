import { Controller, Request } from "@piros/tssf";
import { Observable, of, forkJoin } from "rxjs";
import { FleetInfoDto } from "../interface/dtos/fleet-info-dto";
import { FleetsDao } from "../dao/fleets-dao";
import { Session } from "../services/session";
import { UserNotificationService } from "../services/user-notification-service";
import { StartTravelDto } from "../interface/dtos/start-travel-dto";
import { StarsDao } from "../dao/stars-dao";
import { Fleet } from "../model/fleet";
import { Star } from "../model/star";
import { INVALID_TRAVEL_ERROR } from "../interface/errors/errors";
import { START_TRAVEL_NOTIFICATIONS_CHANNEL, END_TRAVEL_NOTIFICATIONS_CHANNEL, DELETE_FLEET_NOTIFICATIONS_CHANNEL, VISIBILITY_GAIN_NOTIFICATIONS_CHANNEL } from "../channels";
import { StartTravelNotificationDto } from "../interface/dtos/start-travel-notification-dto";
import { EndTravelNotificationDto } from "../interface/dtos/end-travel-notification-dto";
import { DeleteFleetNotificationDto } from "../interface/dtos/delete-fleet-notification-dto";
import { VisibilityGainedNotificationDto } from "../interface/dtos/visibility-gained-notification";

@Controller
export class FleetsController {

    constructor(
        private fleetsDao: FleetsDao,
        private starsDao: StarsDao,
        private userNotificationService: UserNotificationService
    ) { }

    @Request('get-fleets')
    public getFleets(session: Session): Observable<FleetInfoDto[]> {
        return this.fleetsDao.getFleets(session.civilizationId);
    }

    @Request('start-travel')
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
                
                const s1 = stars[0];
                const s2 = stars[1];
                const x = s1.x - s2.x;
                const y = s1.y - s2.y;
                const travelDistance = Math.sqrt(x*x + y*y);
                const travelTime = travelDistance / fleet.speed;
                const startTravelTime = Date.now();
                const newFleet = {
                    ...fleet,
                    originId: fleet.destinationId,
                    destinationId: dto.destinationStarId,
                    startTravelTime: startTravelTime
                };

                this.fleetsDao.updateFleet(newFleet).subscribe(() => {
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
                        const civilizationsToSendStartTravel = results[1];
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
                    });
                    
                    
                    setTimeout(() => {
                        const endTravelNotification: EndTravelNotificationDto = {
                            fleet: {
                                ...fleet,
                                originId: dto.destinationStarId,
                                destinationId: dto.destinationStarId,
                                startTravelTime: 0
                            }
                        };

                        //enviar evento ganar visibilidad si no tenia visibilidad
                        this.starsDao.canCivilizationViewStar(fleet.civilizationId, dto.destinationStarId).subscribe(result =>{
                            if (!result) {
                                const visibilityGainNotification: VisibilityGainedNotificationDto = {
                                    starSystem: dto.destinationStarId,
                                    orbitingFleets: [],
                                    incomingFleets: []
                                };
                                this.userNotificationService.sendToUser(session.user.id, VISIBILITY_GAIN_NOTIFICATIONS_CHANNEL, visibilityGainNotification);
                            }
                        });

                        forkJoin(
                            this.starsDao.saveVisibleStars([{ starId: dto.destinationStarId, civilizationId: fleet.civilizationId }]),
                            this.fleetsDao.updateFleet(endTravelNotification.fleet)
                        ).subscribe(() => {

                            this.starsDao.getViewerUserIdsInStars([dto.destinationStarId]).subscribe(users =>{
                                users.forEach(u => {
                                    this.userNotificationService.sendToUser(u.userId, END_TRAVEL_NOTIFICATIONS_CHANNEL, endTravelNotification);
                                });
                            });

                        });
                        
                    }, travelTime);

                    obs.next(true);
                    obs.complete();
                });
            });
        });
    }

    private isValidTravel(dto: StartTravelDto, fleet: Fleet, stars: Star[], session: Session): boolean {
        return true;;
    }

}