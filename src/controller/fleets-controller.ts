import { Controller, Request } from "@piros/tssf";
import { Observable } from "rxjs";
import { FleetInfoDto } from "../interface/dtos/fleet-info-dto";
import { Session } from "../services/session";
import { StartTravelDto } from "../interface/dtos/start-travel-dto";
import { FleetService } from "../services/fleets/fleets-service";

@Controller
export class FleetsController {

    constructor(
        private fleetService: FleetService
    ) { }

    @Request('get-fleets')
    public getFleets(session: Session): Observable<FleetInfoDto[]> {
        return this.fleetService.getVisibleFleets(session.civilizationId);
    }

    @Request('start-travel')
    public startTravel(session: Session, dto: StartTravelDto): Observable<boolean> {
        return this.fleetService.startTravel(session, dto);
    }

}