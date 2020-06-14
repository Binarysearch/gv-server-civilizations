import { Controller, Request } from "@piros/tssf";
import { CivilizationsDao } from "../dao/civilizations-dao";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import * as uuid from "uuid";
import { Session } from "../services/session";
import { CivilizationDto } from "../interface/dtos/civilization-dto";

@Controller
export class CivilizationsController {

    constructor(
        private civilizationsDao: CivilizationsDao
    ) { }

    @Request('get-civilization')
    public getCivilization(session: Session): Observable<CivilizationDto> {
        return this.civilizationsDao.getByUserId(session.user.id).pipe(
            map(civ => {
                if (!civ) {
                    return null;
                }
                return { id: civ.id, name: civ.name };
            })
        );
    }

    @Request('create-civilization')
    public createCivilization(session: Session, name: string): Observable<string> {
        const id = uuid.v4();
        return this.civilizationsDao.createCivilization({ id: id, user: session.user.id, name: name }).pipe(
            map(() => id)
        );
    }
}