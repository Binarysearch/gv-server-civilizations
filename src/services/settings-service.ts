import { Injectable } from "@piros/ioc";
import { Settings } from "../model/settings";

@Injectable
export class SettingsService {

    private settings: Settings = {
        buildTimeMultiplier: 1,
        fleetSpeedMultiplier: 1
    }

    constructor() { }

    public getSettings(): Settings {
        return this.settings;
    }

    public setSettings(settings: Settings): void {
        this.settings = settings;
    }
}