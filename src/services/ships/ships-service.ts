import { Observable, forkJoin, of } from "rxjs";
import { FleetsDao } from "../../dao/fleets-dao";
import { Session } from "../../services/session";
import { UserNotificationService } from "../../services/user-notification-service";
import { Fleet } from "../../model/fleet";
import { CREATE_SHIP_NOTIFICATIONS_CHANNEL, BUILDING_ORDERS_NOTIFICATIONS_CHANNEL } from "../../channels";
import * as uuid from "uuid";

import { Injectable } from "@piros/ioc";
import { ShipsDao } from "../../dao/ships-dao";
import { BuildingOrdersNotificationDto } from "../../interface/dtos/building-orders-notification";
import { BuildingOrderType } from "../../interface/dtos/building-order-dto";
import { CreateShipNotificationDto } from "../../interface/dtos/create-ship-notification-dto";
import { Ship } from "../../model/ship";
import { ShipDto } from "../../interface/dtos/ship-dto";

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
export class ShipsService {

    private timeouts: NodeJS.Timeout[] = [];

    constructor(
        private shipsDao: ShipsDao,
        private fleetsDao: FleetsDao,
        private userNotificationService: UserNotificationService
    ) { }

    public getFleetShips(fleetId: string): Observable<ShipDto[]> {
        return this.shipsDao.getFleetShips(fleetId);
    }

    public buildShip(session: Session, colonyId: string): Observable<boolean> {

        const startedTime = Date.now();
        const buildTime = 500;

        const buildingOrder = {
            id: uuid.v4(),
            colonyId: colonyId,
            type: BuildingOrderType.SHIP,
            endTime: startedTime + buildTime,
            startedTime: startedTime
        }
        const buildingOrdersNotification: BuildingOrdersNotificationDto = {
            buildingOrders: [ buildingOrder ],
            finishedBuildingOrders: []
        }
        
        this.userNotificationService.sendToUser(session.user.id, BUILDING_ORDERS_NOTIFICATIONS_CHANNEL, buildingOrdersNotification);

        this.setTimeout(() => {

            this.fleetsDao.getFleetByColonyId(colonyId).subscribe(fleet => {
                const ship: Ship = {
                    id: uuid.v4(),
                    fleet: fleet.id
                };
    
                const updatedFleet: Fleet = {
                    ...fleet,
                    shipCount: fleet.shipCount + 1
                }
    
                forkJoin(
                    this.shipsDao.saveShips([ship]),
                    this.fleetsDao.updateFleet(updatedFleet)
                ).subscribe(() => {
    
                    const createShipNotification: CreateShipNotificationDto = {
                        ship: ship,
                        fleet: updatedFleet
                    }

                    const buildingOrdersNotification: BuildingOrdersNotificationDto = {
                        buildingOrders: [ ],
                        finishedBuildingOrders: [
                            {
                                id: buildingOrder.id,
                                colonyId: buildingOrder.colonyId
                            }
                        ]
                    }

                    this.userNotificationService.sendToUser(session.user.id, CREATE_SHIP_NOTIFICATIONS_CHANNEL, createShipNotification);
                    this.userNotificationService.sendToUser(session.user.id, BUILDING_ORDERS_NOTIFICATIONS_CHANNEL, buildingOrdersNotification);
    
                });
    
            });

        }, buildTime);
        
        return of(true);
    }

    setTimeout(callback: () => void, millis: number) {
        this.timeouts.push(setTimeout(callback, millis));
    }

    // TODO: Eliminar, esto es para testing
    clearState() {
        this.timeouts.forEach((t) => {
            clearTimeout(t);
        });
    }
}