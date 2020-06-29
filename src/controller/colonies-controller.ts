import { Controller, Request } from "@piros/tssf";
import { Observable } from "rxjs";
import { ColonyDto } from "../interface/dtos/colony-dto";
import { ColoniesDao } from "../dao/colonies-dao";
import { Session } from "../services/session";

@Controller
export class ColoniesController {

    constructor(
        private coloniesDao: ColoniesDao
    ) { }

    @Request('get-visible-colonies')
    public getVisibleColonies(session: Session): Observable<ColonyDto[]> {
        return this.coloniesDao.getVisibleColonies(session.civilizationId);
    }

}