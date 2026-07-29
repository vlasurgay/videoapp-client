import { Routes } from '@angular/router';
import { UploadComponent } from '../app/components/upload/upload.component'
import { VideoComponent } from './components/video/video.component';

export const routes: Routes = [
    {path: '', component: UploadComponent},
    {path: 'video/:id', component: VideoComponent}
];
