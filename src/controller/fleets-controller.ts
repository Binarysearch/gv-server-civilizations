import { Controller, Request } from "@piros/tssf";
import { Observable } from "rxjs";
import { FleetInfoDto } from "../interface/dtos/fleet-info-dto";
import { FleetsDao } from "../dao/fleets-dao";
import { Session } from "../services/session";

@Controller
export class FleetsController {

    constructor(
        private fleetsDao: FleetsDao
    ) { }

    @Request('get-fleets')
    public getFleets(session: Session): Observable<FleetInfoDto[]> {
        return this.fleetsDao.getFleets(session.civilizationId);
    }

}