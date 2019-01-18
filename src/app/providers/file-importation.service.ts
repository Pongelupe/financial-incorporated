import { Injectable } from '@angular/core';
import { ElectronService } from './electron.service';
import { DocumentType } from '../components/home/enums/documentType';

@Injectable({
  providedIn: 'root'
})
export class FileImportationService extends ElectronService {

  constructor() {
    super();
  }

  async generateExcel(payload: { path: string, documentType: DocumentType }): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      this.ipcRenderer.once('excelGenerated', (event, path) => resolve(path));
      this.ipcRenderer.send('generateExcel', payload);
    });
  }

}
