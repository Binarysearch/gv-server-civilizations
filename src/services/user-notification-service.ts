import { Injectable } from "@piros/ioc";
import { NotificationService, Subscription } from "@piros/tssf";

@Injectable
export class UserNotificationService {

    private userSubscriptions: Map<string, Subscription[]> = new Map();

    constructor(
        private notification: NotificationService
    ){
        this.notification.getSubscriptionCreations().subscribe(subscription => {
            const userId = subscription.wsConnection.session.user.id;
            let userSubscriptionList = this.userSubscriptions.get(userId);
            if (!userSubscriptionList) {
                userSubscriptionList = [];
            }

            userSubscriptionList.push(subscription);
            this.userSubscriptions.set(userId, userSubscriptionList);
        });

        this.notification.getSubscriptionDeletions().subscribe(subscription => {
            const userId = subscription.wsConnection.session.user.id;
            const userSubscriptionList = this.userSubscriptions.get(userId);
            if (userSubscriptionList) {
                const newSubscriptionList = userSubscriptionList.filter(
                    userSubscription => {
                        return userSubscription.id !== subscription.id
                    }
                );

                if (newSubscriptionList.length > 0) {
                    this.userSubscriptions.set(userId, newSubscriptionList);
                } else {
                    this.userSubscriptions.delete(userId);
                }
            }
        });
    }

    public sendToUser(userId: string, channel: string, payload: any): void {
        const userSubscriptionList = this.userSubscriptions.get(userId);
        if (userSubscriptionList) {
            userSubscriptionList.forEach(subscription => {
                if (subscription.channel === channel) {
                    subscription.send(payload);
                }
            });
        }
    }
}