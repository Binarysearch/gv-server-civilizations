import { FleetInfoDto } from './fleet-info-dto';
import { ShipDto } from './ship-dto';

export interface CreateShipNotificationDto {

    fleet: FleetInfoDto;
    ship: ShipDto;
     
}