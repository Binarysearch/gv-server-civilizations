import { FleetInfoDto } from './fleet-info-dto';

export interface VisibilityGainedNotificationDto {

	starSystem: string;
    orbitingFleets: FleetInfoDto[];
    incomingFleets: FleetInfoDto[];

}