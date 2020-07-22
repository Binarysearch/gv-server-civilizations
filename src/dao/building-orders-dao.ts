import { Injectable } from "@piros/ioc";
import { Observable } from "rxjs";
import { DatabaseService } from "@piros/gv-server-commons";
import { BuildingOrder } from "../model/building-order";

@Injectable
export class BuildingOrdersDao {

    constructor(
        private ds: DatabaseService
    ) {
        
    }

    public deleteBuildingOrder(id: string): Observable<void> {
        return this.ds.execute(`DELETE FROM building_orders WHERE id =$1;`, [ id ]);
    }

    public getColonyBuildingOrders(colonyId: string): Observable<BuildingOrder[]> {
        return this.ds.getAll<BuildingOrder>(
            `
            SELECT
                id,
                type,
                colony as "colonyId",
                started_time as "startedTime",
                end_time as "endTime"
            FROM
                building_orders
            WHERE
                colony = $1;
        `, [ colonyId ]);
    }

    public getBuildingOrders(civilizationId: string): Observable<BuildingOrder[]> {
        return this.ds.getAll<BuildingOrder>(
            `
            SELECT
                b.id,
                b.type,
                b.colony as "colonyId",
                b.started_time as "startedTime",
                b.end_time as "endTime"
            FROM
                building_orders b JOIN colonies c ON c.id = b.colony
            WHERE 
                c.civilization = $1;
        `, [ civilizationId ]);
    }

    public saveBuildingOrders(buildingOrders: BuildingOrder[]): Observable<void> {

        const values = buildingOrders.map(s => {
            return `('${s.id}', '${s.type}', '${s.colonyId}', '${s.startedTime}', '${s.endTime}')`;
        }).join(',');

        const insertQuery = `
            INSERT INTO building_orders(
                id,
                type,
                colony,
                started_time,
                end_time
            ) VALUES ${values};
        `;
        return this.ds.execute(insertQuery, []);
    }
    
}