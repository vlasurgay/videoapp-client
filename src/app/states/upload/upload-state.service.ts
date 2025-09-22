import { ComponentStore } from '@ngrx/component-store';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { UploadState } from './upload-state.model';
import { UploadStatus } from '../../models/video/upload-status.enum';


@Injectable({ providedIn: 'root' })
export class UploadStateService extends ComponentStore<UploadState> {

    constructor() { 
        super({ 
            key: '',
            uploadId: '', 
            status: UploadStatus.IDLE,
            totalParts: 0,
            progress: 0, 

        }); 
    }

    override readonly state$: Observable<UploadState> = this.select(state => state);

    updateState(update: Partial<UploadState>) { 
        this.patchState(update); 
    }

    resetState() { 
        this.patchState({ 
            key: '',
            uploadId: '', 
            status: UploadStatus.IDLE,
            totalParts: 0,
            progress: 0,
        }); 
    }

    getState(): UploadState {
      return this.get();
    }

    incrementProgress() {
      this.patchState(state => ({
        progress: state.progress + 1
      }));
    }
}