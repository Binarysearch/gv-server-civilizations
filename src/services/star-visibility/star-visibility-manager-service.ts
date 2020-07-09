import { Logger } from "@piros/tssf";
import { FleetsDao } from "../../dao/fleets-dao";
import { UserNotificationService } from "../user-notification-service";
import { StarsDao } from "../../dao/stars-dao";
import { VISIBILITY_GAIN_NOTIFICATIONS_CHANNEL, VISIBILITY_LOST_NOTIFICATIONS_CHANNEL } from "../../channels";
import { VisibilityGainedNotificationDto } from "../../interface/dtos/visibility-gained-notification";

import { PlanetsDao } from "../../dao/planets-dao";
import { ColoniesDao } from "../../dao/colonies-dao";
import { Injectable } from "@piros/ioc";
import { FleetService } from "../fleets/fleets-service";
import { EndTravelManagerService } from "../fleets/end-travel-manager-service";
import { VisibilityLostNotificationDto } from "../../interface/dtos/visibility-lost-notidication";
import { ColoniesService } from "../fleets/colonies-service";

@Injectable
export class StarVisibilityService {

    constructor(
        private fleetService: FleetService,
        private starsDao: StarsDao,
        private planetsDao: PlanetsDao,
        private coloniesService: ColoniesService,
        private userNotificationService: UserNotificationService,
        private endTravelManagerService: EndTravelManagerService
    ) { }

    public startProcesingEvents(): void {
        this.fleetService.getStartTravelEvents().subscribe(
            startTravelEvent => {
                const {
                    originStarId,
                    userId,
                    civilizationId
                } = startTravelEvent;

                //Enviar evento perdida de visibilidad cuando se pierda la visibilidad en el sistema origen
                this.starsDao.getStarCivilizationVisibility(originStarId, civilizationId).subscribe((quantity) => {
                    this.starsDao.addVisibilityToStar({ starId: originStarId, civilizationId: civilizationId, quantity: -1 }).subscribe(() => {
                        if (quantity === 1) {
                            const visibilityLostNotification: VisibilityLostNotificationDto = {
                                starId: originStarId
                            };
                            this.userNotificationService.sendToUser(userId, VISIBILITY_LOST_NOTIFICATIONS_CHANNEL, visibilityLostNotification);
                        }
                    });
                });
            }
        );

        this.endTravelManagerService.getEndTravelEvents().subscribe(
            startTravelEvent => {
                const {
                    destinationStarId,
                    userId,
                    civilizationId
                } = startTravelEvent;

                this.starsDao.canCivilizationViewStar(civilizationId, destinationStarId).subscribe(canView => {
                    this.starsDao.addVisibilityToStar({ starId: destinationStarId, civilizationId: civilizationId, quantity: 1 }).subscribe(() => {
                        //enviar evento ganar visibilidad si no tenia visibilidad
                        if (!canView) {
                            this.coloniesService.getColoniesInStar(destinationStarId).subscribe(colonies => {

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
                });
            }
        );

        this.coloniesService.getCreateColonyEvents().subscribe(createColonyEvent => {
            const {
                civilizationId,
                starId
            } = createColonyEvent;

            this.starsDao.addVisibilityToStar({ starId: starId, civilizationId: civilizationId, quantity: 1 }).subscribe();

        })
    }
}