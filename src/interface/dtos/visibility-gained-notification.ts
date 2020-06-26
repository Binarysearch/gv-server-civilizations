import { FleetInfoDto } from './fleet-info-dto';

export interface VisibilityGainedNotificationDto {

	starId: string;
    orbitingFleets: FleetInfoDto[];
    incomingFleets: FleetInfoDto[];

}