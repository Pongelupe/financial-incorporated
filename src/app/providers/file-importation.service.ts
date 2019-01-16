import { Injectable } from '@angular/core';
import { ElectronService } from './electron.service';
import { DocumentType } from '../components/home/enums/documentType';

@Injectable({
  providedIn: 'root'
})
export class FileImportationService extends ElectronService {

  constructor() { super(); }

  generateExcel(payload: { path: string, documentType: DocumentType }): void {
    this.ipcRenderer.send('generateExcel', payload);
  }
}
