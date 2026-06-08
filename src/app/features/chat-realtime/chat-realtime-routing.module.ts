import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ChatRealtimePageComponent } from './pages/chat-realtime-page/chat-realtime-page.component';

const routes: Routes = [{ path: '', component: ChatRealtimePageComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ChatRealtimeRoutingModule {}
