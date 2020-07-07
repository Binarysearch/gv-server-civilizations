import { Controller, Request } from "@piros/tssf";
import { Observable } from "rxjs";
import { ColonyDto } from "../interface/dtos/colony-dto";
import { Session } from "../services/session";
import { ColoniesService } from "../services/fleets/colonies-service";

@Controller
export class ColoniesController {

    constructor(
        private coloniesService: ColoniesService
    ) { }

    @Request('get-visible-colonies')
    public getVisibleColonies(session: Session): Observable<ColonyDto[]> {
        return this.coloniesService.getVisibleColonies(session.civilizationId);
    }

    @Request('create-colony')
    public createColony(session: Session, planetId: string): Observable<boolean> {
        return this.coloniesService.createColony(session, planetId);
    }

}