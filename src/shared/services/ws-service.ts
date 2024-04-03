import { Injectable } from '@angular/core';
import { WebSocketSubject } from 'rxjs/internal/observable/dom/WebSocketSubject';
import { Message } from '../types/message';
import { Subject } from 'rxjs';
import { webSocket } from 'rxjs/webSocket';

export const WS_ENDPOINT = 'ws://localhost:8081';

@Injectable({ providedIn: 'root' })
export class WsService {
    private socket$: WebSocketSubject<Message> | null = null;
    private messageSubject = new Subject<Message>();
    messages$ = this.messageSubject.asObservable();

    constructor() {}

    connect(): void {
        this.socket$ = this.getNewWebsocket();
    }

    private getNewWebsocket(): WebSocketSubject<any> {
        return webSocket({
            url: WS_ENDPOINT,
            openObserver: {
                next: () => console.log('ws connected'),
            },
            closeObserver: {
                next: () => {
                    console.log('ws closed');
                    this.socket$ = null;
                    this.connect(); // reconnect
                },
            },
        });
    }

    sendMessage(msg: Message): void {
        console.log('send msg', msg.type);
        this.socket$?.next(msg);
    }
}
