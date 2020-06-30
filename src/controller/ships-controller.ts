import { Controller, Request } from "@piros/tssf";
import { Observable } from "rxjs";
import { ShipDto } from "../interface/dtos/ship-dto";
import { ShipsDao } from "../dao/ships-dao";
import { Session } from "../services/session";

@Controller
export class ShipsController {

    constructor(
        private shipsDao: ShipsDao
    ) { }

    @Request('get-fleet-ships')
    public getFleetShips(session: Session, fleetId: string): Observable<ShipDto[]> {
        return this.shipsDao.getFleetShips(fleetId);
    }

}