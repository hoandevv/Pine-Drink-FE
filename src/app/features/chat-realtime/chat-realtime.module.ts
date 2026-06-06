import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { ChatRealtimeRoutingModule } from './chat-realtime-routing.module';
import { ChatRealtimePageComponent } from './pages/chat-realtime-page/chat-realtime-page.component';

@NgModule({
  declarations: [ChatRealtimePageComponent],
  imports: [SharedModule, ChatRealtimeRoutingModule]
})
export class ChatRealtimeModule {}
