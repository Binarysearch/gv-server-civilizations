import { Controller, Request } from "@piros/tssf";
import { Observable } from "rxjs";
import { ColonyDto } from "../interface/dtos/colony-dto";
import { Session } from "../services/session";
import { ColoniesService } from "../services/fleets/colonies-service";
import { BuildingOrderDto } from "../interface/dtos/building-order-dto";
import { BuildingOrdersDao } from "../dao/building-orders-dao";

@Controller
export class ColoniesController {

    constructor(
        private coloniesService: ColoniesService,
        private buildingOrdersDao: BuildingOrdersDao,
    ) { }

    @Request('get-visible-colonies')
    public getVisibleColonies(session: Session): Observable<ColonyDto[]> {
        return this.coloniesService.getVisibleColonies(session.civilizationId);
    }

    @Request('create-colony')
    public createColony(session: Session, planetId: string): Observable<boolean> {
        return this.coloniesService.createColony(session, planetId);
    }

    @Request('get-building-orders')
    public getBuildingOrders(session: Session): Observable<BuildingOrderDto[]> {
        return this.buildingOrdersDao.getBuildingOrders(session.civilizationId);
    }

}