
export interface Event<T, P> {

    type: T;
    timestamp: number;
    user: string;
    payload: P;
    
}