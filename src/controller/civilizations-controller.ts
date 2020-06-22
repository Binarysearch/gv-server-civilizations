import { Controller, Request } from "@piros/tssf";
import { CivilizationsDao } from "../dao/civilizations-dao";
import { Observable, forkJoin } from "rxjs";
import { map } from "rxjs/operators";
import * as uuid from "uuid";
import { Session } from "../services/session";
import { CivilizationDto } from "../interface/dtos/civilization-dto";
import { CREATE_CIVILIZATION_CHANNEL } from "../channels";
import { UserNotificationService } from "../services/user-notification-service";
import { StarsDao } from "../dao/stars-dao";
import { PlanetsDao } from "../dao/planets-dao";
import { Planet } from "../model/planet";

@Controller
export class CivilizationsController {

    constructor(
        private civilizationsDao: CivilizationsDao,
        private starsDao: StarsDao,
        private planetsDao: PlanetsDao,
        private userNotificationService: UserNotificationService
    ) { }

    @Request('get-civilization')
    public getCivilization(session: Session): Observable<CivilizationDto> {
        return this.civilizationsDao.getByUserId(session.user.id).pipe(
            map(civ => {
                if (!civ) {
                    return null;
                }
                return { id: civ.id, name: civ.name, homeworld: civ.homeworld };
            })
        );
    }

    @Request('create-civilization')
    public createCivilization(session: Session, name: string): Observable<string> {
        return new Observable((obs) => {
            this.starsDao.getRandomUnexploredStar().subscribe(star => {
                const id = uuid.v4();
                const homeworld = uuid.v4();
                const starId = star.id;
                const civilization = { id: id, user: session.user.id, name: name, homeworld: homeworld };
                
                const planets: Planet[] = [{
                    id: homeworld,
                    starSystem: starId,
                    type: 1,
                    size: 1,
                    orbit: 1
                }];

                forkJoin(
                    this.planetsDao.savePlanets(planets),
                    this.civilizationsDao.createCivilization(civilization),
                    this.starsDao.markStarAsExplored(starId),
                    this.starsDao.saveKnownStars([{ starId: starId, civilizationId: id }])
                ).subscribe(() => {
                    session.civilizationId = id;
                    this.userNotificationService.sendToUser(session.user.id, CREATE_CIVILIZATION_CHANNEL, civilization)
                    obs.next(id);
                    obs.complete();
                });
            });
        });
    }
}