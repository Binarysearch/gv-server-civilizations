import { Application, WsAuthService, SecurityService } from '@piros/tssf';
import { LocalAuthService } from './services/local-auth-service';
import { LocalSecurityService } from './services/local-security-service';
import { UsersController } from './controller/users-controller';
import { Injector } from '@piros/ioc';
import { AplicationStatusService, DefaultStatusProvider, ReplicaStatus } from '@piros/status';


import { DatabaseService } from '@piros/gv-server-commons';
import { CivilizationsController } from './controller/civilizations-controller';
import { StarsController } from './controller/stars-controller';
import { CREATE_CIVILIZATION_CHANNEL } from './channels';

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
    name text
);

DROP TABLE IF EXISTS stars;
CREATE TABLE stars(
    id text PRIMARY KEY,
    name text,
    x real,
    y real,
    type integer,
    size integer
);
`, []).subscribe(()=>{
    injector.setProviders([
        { provide: WsAuthService, useClass: LocalAuthService },
        { provide: SecurityService, useClass: LocalSecurityService },
        { provide: DefaultStatusProvider, useClass: MyStatusProvider }
    ]);
    
    new Application({
        controllers: [
            UsersController,
            CivilizationsController,
            StarsController
        ],
        channels: [
            CREATE_CIVILIZATION_CHANNEL
        ]
    }, injector).start(<any>process.env.LISTEN_PORT);

    const statusService = injector.resolve(AplicationStatusService);
    statusService.getStatus().subscribe(status => {
        console.log('STATUS CHANGED:');
        console.log(status.services.get('gv-server-civilizations'));
    });
    
});

