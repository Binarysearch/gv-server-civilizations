import { BuildingOrderType } from "../../model/building-order";

export interface BuildingOrderDto {

    id: string;
    type: BuildingOrderType;
    colonyId: string;
    startedTime: number;
    endTime: number;

}

export interface FinishedBuildingOrderDto {

    id: string;
    colonyId: string;

}