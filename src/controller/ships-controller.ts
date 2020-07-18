import { Controller, Request } from "@piros/tssf";
import { Observable } from "rxjs";
import { ShipDto } from "../interface/dtos/ship-dto";
import { Session } from "../services/session";
import { ShipsService } from "../services/ships/ships-service";


@Controller
export class ShipsController {

    constructor(
        private shipsService: ShipsService
    ) { }

    @Request('get-fleet-ships')
    public getFleetShips(session: Session, fleetId: string): Observable<ShipDto[]> {
        return this.shipsService.getFleetShips(fleetId);
    }

    @Request('build-ship')
    public buildShip(session: Session, colonyId: string): Observable<boolean> {
        return this.shipsService.buildShip(session, colonyId);
    }
}