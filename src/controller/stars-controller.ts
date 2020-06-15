import { Controller, Request } from "@piros/tssf";
import { Observable, of } from "rxjs";
import { StarSystemInfoDto } from "../interface/dtos/star-system-info-dto";

@Controller
export class StarsController {

    constructor() { }

    @Request('get-stars')
    public getStars(): Observable<StarSystemInfoDto[]> {
        return of([
            {
                id: 'id',
                name: 'name',
                x: 0,
                y: 0,
                type: 3,
                size: 3
            }
        ]);
    }


}