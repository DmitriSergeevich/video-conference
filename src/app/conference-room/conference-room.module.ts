import {NgModule} from "@angular/core";
import {AppComponent} from "../app.component";
import {ConferenceRoomComponent} from "./conference-room.component";
import {ConferenceRoomRoutingModule} from "./conference-room-routing.module";

@NgModule({
  declarations: [
    ConferenceRoomComponent
  ],
  imports: [
    ConferenceRoomRoutingModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class ConferenceRoomModule { }
