import { Application, WsAuthService, SecurityService } from '@piros/tssf';
import { LocalAuthService } from './services/local-auth-service';
import { LocalSecurityService } from './services/local-security-service';
import { UsersController } from './controller/users-controller';
import { Injector } from '@piros/ioc';
import { AplicationStatusService, DefaultStatusProvider, ReplicaStatus } from '@piros/status';

import * as uuid from "uuid";

import { DatabaseService } from '@piros/gv-server-commons';
import { CivilizationsController } from './controller/civilizations-controller';
import { StarsController } from './controller/stars-controller';
import { CREATE_CIVILIZATION_CHANNEL, START_TRAVEL_NOTIFICATIONS_CHANNEL, END_TRAVEL_NOTIFICATIONS_CHANNEL, DELETE_FLEET_NOTIFICATIONS_CHANNEL } from './channels';
import { PlanetsController } from './controller/planets-controller';
import { StarsDao } from './dao/stars-dao';
import { Star } from './model/star';
import { FleetsController } from './controller/fleets-controller';

class MyStatusProvider extends DefaultStatusProvider {

    constructor() {
        super();
    }

    public get defaultStatus(): ReplicaStatus {
        return {
            host: process.env.POD_IP,
            replicaData: 'nothing'
        }
    }
}

const injector = new Injector();

const ds: DatabaseService = injector.resolve(DatabaseService);

ds.execute(`

DROP TABLE IF EXISTS users;
CREATE TABLE users(
    id text PRIMARY KEY,
    username text,
    password text
);

DROP TABLE IF EXISTS sessions;
CREATE TABLE sessions(
    token text PRIMARY KEY,
    "user" text
);

DROP TABLE IF EXISTS civilizations;
CREATE TABLE civilizations(
    id text PRIMARY KEY,
    "user" text,
    name text,
    homeworld text
);

DROP TABLE IF EXISTS stars;
CREATE TABLE stars(
    id text PRIMARY KEY,
    name text,
    x real,
    y real,
    type integer,
    size integer,
    explored boolean
);

DROP TABLE IF EXISTS known_stars;
CREATE TABLE known_stars(
    star text,
    civilization text,
    PRIMARY KEY(star, civilization) 
);

DROP TABLE IF EXISTS planets;
CREATE TABLE planets(
    id text PRIMARY KEY,
    star_system text,
    type integer,
    size integer,
    orbit integer
);

DROP TABLE IF EXISTS visible_stars;
CREATE TABLE visible_stars(
    star text,
    civilization text,
    PRIMARY KEY(star, civilization) 
);

DROP TABLE IF EXISTS fleets;
CREATE TABLE fleets(
    id text PRIMARY KEY,
    civilization text,
    origin text,
    destination text,
    start_travel_time bigint,
    speed real,
    seed real,
    ship_count integer
);
`, []).subscribe(()=>{
    injector.setProviders([
        { provide: WsAuthService, useClass: LocalAuthService },
        { provide: SecurityService, useClass: LocalSecurityService },
        { provide: DefaultStatusProvider, useClass: MyStatusProvider }
    ]);
    
    const starsDao: StarsDao = injector.resolve(StarsDao);

    const stars: Star[] = [];
    const galaxyWidth = 30000;
    const galaxyHeight = 30000;

    for (let i = 0; i < 1000; i++) {
        const star = {
            id: uuid.v4(),
            name: 'name',
            x: galaxyWidth * Math.random() * Math.cos(i),
            y: galaxyHeight * Math.random() * Math.sin(i),
            type: 1,
            size: 1
        };
        stars.push(star);
    }

    starsDao.saveStars(stars).subscribe(()=>{
        console.log('Stars created');
    });

    new Application({
        controllers: [
            UsersController,
            CivilizationsController,
            StarsController,
            PlanetsController,
            FleetsController,
        ],
        channels: [
            CREATE_CIVILIZATION_CHANNEL,
            START_TRAVEL_NOTIFICATIONS_CHANNEL,
            END_TRAVEL_NOTIFICATIONS_CHANNEL,
            DELETE_FLEET_NOTIFICATIONS_CHANNEL,
        ]
    }, injector).start(<any>process.env.LISTEN_PORT);

    const statusService = injector.resolve(AplicationStatusService);
    statusService.getStatus().subscribe(status => {
        console.log('STATUS CHANGED:');
        console.log(status.services.get('gv-server-civilizations'));
    });
    
});

