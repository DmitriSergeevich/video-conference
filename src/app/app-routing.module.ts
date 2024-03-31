import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'room',
  },
  {
    path: 'room',
    loadChildren: () => import('./conference-room/conference-room.module').then((m) => m.ConferenceRoomModule),
  },
  {
    path: 'lobby',
    loadChildren: () => import('./lobby/lobby.module').then((m) => m.LobbyModule),
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
