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
import { Fleet } from "../model/fleet";
import { FleetsDao } from "../dao/fleets-dao";
import { Ship } from "../model/ship";
import { ShipsDao } from "../dao/ships-dao";
import { ColoniesDao } from "../dao/colonies-dao";
import { Colony } from "../model/colony";

@Controller
export class CivilizationsController {

    constructor(
        private civilizationsDao: CivilizationsDao,
        private starsDao: StarsDao,
        private planetsDao: PlanetsDao,
        private fleetsDao: FleetsDao,
        private shipsDao: ShipsDao,
        private coloniesDao: ColoniesDao,
        private userNotificationService: UserNotificationService,
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
                const civilizationId = uuid.v4();
                const homeworld = uuid.v4();
                const fleetId = uuid.v4();
                const starId = star.id;
                const civilization = { id: civilizationId, user: session.user.id, name: name, homeworld: homeworld };
                
                const planets: Planet[] = [{
                    id: homeworld,
                    starSystem: starId,
                    type: 1,
                    size: 1,
                    orbit: 1
                }];

                const fleets: Fleet[] = [{
                    id: fleetId,
                    civilizationId: civilizationId,
                    originId: starId,
                    destinationId: starId,
                    startTravelTime: 0,
                    speed: 1000,
                    seed: 1,
                    shipCount: 1
                }];

                const ships: Ship[] = [{
                    id: uuid.v4(),
                    fleet: fleetId
                }];

                const colonies: Colony[] = [{
                    id: uuid.v4(),
                    civilization: civilizationId,
                    planet: homeworld
                }];

                forkJoin(
                    this.planetsDao.savePlanets(planets),
                    this.shipsDao.saveShips(ships),
                    this.fleetsDao.saveFleets(fleets),
                    this.coloniesDao.saveColonies(colonies),
                    this.civilizationsDao.createCivilization(civilization),
                    this.starsDao.markStarAsExplored(starId),
                    this.starsDao.saveKnownStars([{ starId: starId, civilizationId: civilizationId }]),
                    this.starsDao.addVisibilityToStar({ starId: starId, civilizationId: civilizationId, quantity: 2 }),
                ).subscribe(() => {
                    session.civilizationId = civilizationId;
                    this.userNotificationService.sendToUser(session.user.id, CREATE_CIVILIZATION_CHANNEL, civilization)
                    obs.next(civilizationId);
                    obs.complete();
                });
            });
        });
    }
}