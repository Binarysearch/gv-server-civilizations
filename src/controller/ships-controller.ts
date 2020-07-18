import { Controller, Request } from "@piros/tssf";
import { Observable, of, forkJoin } from "rxjs";
import { ShipDto } from "../interface/dtos/ship-dto";
import { ShipsDao } from "../dao/ships-dao";
import { Session } from "../services/session";
import { Ship } from "../model/ship";
import * as uuid from "uuid";
import { FleetsDao } from "../dao/fleets-dao";
import { Fleet } from "../model/fleet";
import { CreateShipNotificationDto } from "../interface/dtos/create-ship-notification-dto";
import { UserNotificationService } from "../services/user-notification-service";
import { CREATE_SHIP_NOTIFICATIONS_CHANNEL } from "../channels";


@Controller
export class ShipsController {

    constructor(
        private shipsDao: ShipsDao,
        private fleetsDao: FleetsDao,
        private userNotificationService: UserNotificationService
    ) { }

    @Request('get-fleet-ships')
    public getFleetShips(session: Session, fleetId: string): Observable<ShipDto[]> {
        return this.shipsDao.getFleetShips(fleetId);
    }

    @Request('build-ship')
    public buildShip(session: Session, colonyId: string): Observable<boolean> {

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

                this.userNotificationService.sendToUser(session.user.id, CREATE_SHIP_NOTIFICATIONS_CHANNEL, createShipNotification);

            });

        });
        
        return of(true);
    }

}