import { Controller, Request } from "@piros/tssf";
import { Observable } from "rxjs";
import { StarSystemInfoDto } from "../interface/dtos/star-system-info-dto";
import { StarsDao } from "../dao/stars-dao";

@Controller
export class StarsController {

    constructor(
        private starsDao: StarsDao
    ) { }

    @Request('get-stars')
    public getStars(): Observable<StarSystemInfoDto[]> {
        return this.starsDao.getStars();
    }


}