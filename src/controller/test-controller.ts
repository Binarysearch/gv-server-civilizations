import { Controller, Post } from "@piros/tssf";
import { Observable, forkJoin, of } from "rxjs";
import { UserNotificationService } from "../services/user-notification-service";
import { DatabaseService } from "@piros/gv-server-commons";
import { EndTravelManagerService } from "../services/fleets/end-travel-manager-service";
import { ShipsService } from "../services/ships/ships-service";
import { TestSettingsDto } from "../interface/dtos/test-settings-dto";
import { SettingsService } from "../services/settings-service";

@Controller
export class TestController {

    constructor(
        private userNotificationService: UserNotificationService,
        private ds: DatabaseService,
        private endTravelManagerService: EndTravelManagerService,
        private shipsService: ShipsService,
        private settingsService: SettingsService,
    ) { }

    @Post('restore-state')
    public restoreState(): Observable<boolean> {
        this.settingsService.setSettings({
            buildTimeMultiplier: 1,
            fleetSpeedMultiplier: 1
        });
        this.userNotificationService.clearState();
        this.endTravelManagerService.clearState();
        this.shipsService.clearState();
        return new Observable<boolean>(obs => {
            console.log('RESTORE STATE');
            forkJoin(
                this.ds.execute(`UPDATE stars SET explored = false;`, []),
                //this.ds.execute(`DELETE FROM users;`, []),
                this.ds.execute(`DELETE FROM colonies;`, []),
                this.ds.execute(`DELETE FROM ships;`, []),
                this.ds.execute(`DELETE FROM fleets;`, []),
                //this.ds.execute(`DELETE FROM visible_stars;`, []),
                this.ds.execute(`DELETE FROM planets;`, []),
                //this.ds.execute(`DELETE FROM known_stars;`, []),
                //this.ds.execute(`DELETE FROM civilizations;`, []),
                //this.ds.execute(`DELETE FROM sessions;`, []),
            ).subscribe(()=>{
                setTimeout(() => {
                    obs.next(true);
                    obs.complete();
                }, 200);
            });
        });
    }

    @Post('set-settings')
    public setSettings(testSettings: TestSettingsDto): Observable<boolean> {
        this.settingsService.setSettings(testSettings);
        return of(true);
    }
}