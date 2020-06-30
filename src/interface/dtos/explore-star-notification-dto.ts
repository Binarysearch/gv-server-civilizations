import { PlanetInfoDto } from "./planet-info-dto";

export interface ExploreStarNotificationDto {

	starId: string;
    planets: PlanetInfoDto[];

}