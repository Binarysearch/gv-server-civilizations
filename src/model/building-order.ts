export interface BuildingOrder {
    id: string;
    type: BuildingOrderType;
    colonyId: string;
    startedTime: number;
    endTime: number;
}

export enum BuildingOrderType {
    SHIP = 'SHIP'
}