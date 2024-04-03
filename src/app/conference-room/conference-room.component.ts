import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';

const mediaConstraints = {
    audio: true,
    video: {
        width: 720,
        height: 540,
    },
};

@Component({
    selector: 'app-conference-room',
    templateUrl: './conference-room.component.html',
    styleUrls: ['./conference-room.component.scss'],
})
export class ConferenceRoomComponent implements OnInit, AfterViewInit {
    private localStream: MediaStream | null = null;
    @ViewChild('local_video') localVideo!: ElementRef;
    constructor() {}

    ngOnInit(): void {}

    ngAfterViewInit() {
        this.requestMediaDevices();
    }

    private async requestMediaDevices(): Promise<void> {
        this.localStream = await navigator.mediaDevices.getUserMedia(mediaConstraints);
        this.localVideo.nativeElement.srcObject = this.localStream;
    }
}
