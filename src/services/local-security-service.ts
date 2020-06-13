import { Injectable } from "@piros/ioc";
import { SecurityService, Session } from "@piros/tssf";

@Injectable
export class LocalSecurityService extends SecurityService {
    
    constructor(
        
    ) {
        super();
    }

    canMakeRequest(session: Session, requestType: string): boolean{
        return true;
    }

    canListenChannel(session: Session, channelName: string): boolean{
        return true;
    }

}
