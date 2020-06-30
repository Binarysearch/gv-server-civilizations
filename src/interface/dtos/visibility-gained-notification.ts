import { FleetInfoDto } from './fleet-info-dto';
import { ColonyDto } from './colony-dto';

export interface VisibilityGainedNotificationDto {

	starId: string;
    colonies: ColonyDto[];
    orbitingFleets: FleetInfoDto[];
    incomingFleets: FleetInfoDto[];

}