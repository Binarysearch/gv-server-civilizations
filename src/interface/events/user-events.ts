import { Event } from "./event";

export enum UserEventType {
    CREATE = 'CREATE'
}

export interface UserEvent<P> extends Event<UserEventType, P> {

}