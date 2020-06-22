export interface Session {
    id: string;
    authToken: string;
    user: { id: string; };
    civilizationId?: string;
}