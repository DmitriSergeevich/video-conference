import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { WsService } from '../../shared/services/ws-service';
import { Subject, takeUntil } from 'rxjs';
import { Message } from '../../shared/types/message';

const mediaConstraints = {
    audio: true,
    video: {
        width: 720,
        height: 540,
    },
};

const offerOptions = {
    offerToReceiveAudio: true,
    offerToReceiveVideo: true,
};

@Component({
    selector: 'app-conference-room',
    templateUrl: './conference-room.component.html',
    styleUrls: ['./conference-room.component.scss'],
})
export class ConferenceRoomComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild('local_video') localVideo!: ElementRef;
    @ViewChild('remote_video') remoteVideo!: ElementRef;

    private localStream: MediaStream | null = null;
    private peerConnection: RTCPeerConnection | null = null;
    private readonly destroy$ = new Subject<void>();
    constructor(private wsService: WsService) {}

    ngOnInit(): void {}

    ngAfterViewInit() {
        this.addIncomingMessageHandler();
        this.requestMediaDevices();
    }

    private async requestMediaDevices(): Promise<void> {
        this.localStream = await navigator.mediaDevices.getUserMedia(mediaConstraints);
        this.pauseLocalVideo();
    }

    pauseLocalVideo(): void {
        this.localStream?.getTracks().forEach((track) => (track.enabled = false));
        this.localVideo.nativeElement.srcObject = undefined;
    }

    startLocalVideo(): void {
        this.localStream?.getTracks().forEach((track) => (track.enabled = true));
        this.localVideo.nativeElement.srcObject = this.localStream;
    }

    private closeVideoCall(): void {
        if (this.peerConnection) {
            this.peerConnection.onicecandidate = null;
            this.peerConnection.onicegatheringstatechange = null;
            this.peerConnection.onsignalingstatechange = null;
            this.peerConnection.ontrack = null;
        }

        this.peerConnection?.getTransceivers().forEach((transceiver) => transceiver.stop());

        this.peerConnection?.close();
        this.peerConnection = null;
    }

    async call(): Promise<void> {
        this.createPeerConnection();

        if (this.localStream) {
            this.localStream.getTracks().forEach((track) => this.peerConnection?.addTrack(track, this.localStream!));
        }
        try {
            const offer = await this.peerConnection?.createOffer(offerOptions);
            await this.peerConnection?.setLocalDescription(offer);

            this.wsService.sendMessage({ type: 'offer', data: offer });
        } catch (err) {
            this.handleGetUserMediaError(err);
        }
    }

    private createPeerConnection(): void {
        this.peerConnection = new RTCPeerConnection({
            iceServers: [
                {
                    urls: ['stun:stun.kundenserver.de:3478'],
                },
            ],
        });

        this.peerConnection.onicecandidate = this.handleICECandidateEvent;
        this.peerConnection.onicegatheringstatechange = this.handleIceGatheringStateChange;
        this.peerConnection.onsignalingstatechange = this.handleSignalingStateChange;
        this.peerConnection.ontrack = this.handleTrackEvent;
    }

    private handleGetUserMediaError(err: any) {
        switch (err?.name) {
            case 'NotFoundError':
                alert('Невозможно начать звонок, камера или микрофон не обнаружены.');
                break;
            case 'SecurityError':
            case 'PermissionDeniedError':
                break;
            default:
                console.error('Ошибка создания пир соединения', err);
                alert('Ошибка открытия камеры' + err.message);
                break;
        }
        this.closeVideoCall();
    }

    private handleICECandidateEvent = (event: RTCPeerConnectionIceEvent) => {
        console.log(event);
        if (event.candidate) {
            this.wsService.sendMessage({
                type: 'ice-candidate',
                data: event.candidate,
            });
        }
    };

    private handleIceGatheringStateChange = (event: Event) => {
        console.log(event);
        switch (this.peerConnection?.iceConnectionState) {
            case 'closed':
            case 'failed':
            case 'disconnected':
                this.closeVideoCall();
                break;
        }
    };

    private handleSignalingStateChange = (event: Event) => {
        console.log(event);
        switch (this.peerConnection?.signalingState) {
            case 'closed':
                this.closeVideoCall();
                break;
        }
    };

    private handleTrackEvent = (event: RTCTrackEvent) => {
        console.log(event);
        this.remoteVideo.nativeElement.srcObject = event.streams[0];
    };

    private addIncomingMessageHandler() {
        this.wsService.connect();
        this.wsService.messages$.pipe(takeUntil(this.destroy$)).subscribe(
            (message) => {
                switch (message.type) {
                    case 'offer':
                        this.handleOfferMessage(message.data);
                        break;
                    case 'answer':
                        this.handleAnswerMessage(message.data);
                        break;
                    case 'hangup':
                        this.handleHangupMessage(message);
                        break;
                    case 'ice-candidate':
                        this.handleICECandidateMessage(message.data);
                        break;
                    default:
                        console.log('Неизвестный тип сообщения' + message.type);
                }
            },
            (error) => console.log(error),
        );
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private handleOfferMessage = (msg: RTCSessionDescriptionInit): void => {
        if (!this.peerConnection) {
            this.createPeerConnection();
        }

        if (!this.localStream) {
            this.startLocalVideo();
        }

        this.peerConnection
            ?.setRemoteDescription(new RTCSessionDescription(msg))
            .then(() => {
                this.localVideo.nativeElement.srcObject = this.localStream;
                this.localStream?.getTracks().forEach((track) => this.peerConnection?.addTrack(track, this.localStream!));
            })
            .then(() => {
                return this.peerConnection?.createAnswer();
            })
            .then((answer) => {
                return this.peerConnection?.setLocalDescription(answer);
            })
            .then(() => {
                this.wsService.sendMessage({
                    type: 'answer',
                    data: this.peerConnection?.localDescription,
                });
            })
            .catch(this.handleGetUserMediaError);
    };

    private handleAnswerMessage(data: any) {
        this.peerConnection?.setRemoteDescription(data);
    }

    private handleHangupMessage(message: Message) {
        this.closeVideoCall();
    }

    private handleICECandidateMessage(data: any) {
        this.peerConnection?.addIceCandidate(data).catch(this.reportError);
    }

    private reportError = (e: Error) => {
        console.log('got Error' + e.name, e);
    };

    hangUp() {
        this.wsService.sendMessage({ type: 'hangup', data: '' });
        this.closeVideoCall();
    }
}
