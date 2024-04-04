import { NgModule } from '@angular/core';
import { AppComponent } from '../app.component';
import { ConferenceRoomComponent } from './conference-room.component';
import { ConferenceRoomRoutingModule } from './conference-room-routing.module';
import { MatButtonModule } from '@angular/material/button';

@NgModule({
    declarations: [ConferenceRoomComponent],
    imports: [ConferenceRoomRoutingModule, MatButtonModule],
    providers: [],
    bootstrap: [AppComponent],
})
export class ConferenceRoomModule {}
