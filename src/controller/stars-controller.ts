import { Controller, Request } from "@piros/tssf";
import { Observable } from "rxjs";
import { StarSystemInfoDto } from "../interface/dtos/star-system-info-dto";
import { StarsDao } from "../dao/stars-dao";
import { Session } from "../services/session";

@Controller
export class StarsController {

    constructor(
        private starsDao: StarsDao
    ) { }

    @Request('get-stars')
    public getStars(): Observable<StarSystemInfoDto[]> {
        return this.starsDao.getStars();
    }

    @Request('get-stars-with-presence')
    public getStarsWithPresence(session: Session): Observable<string[]> {
        return this.starsDao.getStarsWithPresence(session.civilizationId);
    }

    @Request('get-explored-stars')
    public getExploredStars(session: Session): Observable<string[]> {
        return this.starsDao.getExploredStars(session.civilizationId);
    }

}