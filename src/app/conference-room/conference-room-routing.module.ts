import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {ConferenceRoomComponent} from "./conference-room.component";

const routes: Routes = [
  {
    path: '',
    component: ConferenceRoomComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ConferenceRoomRoutingModule { }
