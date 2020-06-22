import { Controller, Request } from "@piros/tssf";
import { Observable, of } from "rxjs";
import { PlanetInfoDto } from "../interface/dtos/planet-info-dto";
import { PlanetsDao } from "../dao/planets-dao";
import { Session } from "../services/session";

@Controller
export class PlanetsController {

    constructor(
        private planetsDao: PlanetsDao
    ) { }

    @Request('get-planets')
    public getPlanets(session: Session): Observable<PlanetInfoDto[]> {
        return this.planetsDao.getPlanets(session.civilizationId);
    }


}