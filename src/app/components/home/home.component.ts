import { Component, OnInit } from '@angular/core';
import { FileSystemFileEntry, UploadEvent } from 'ngx-file-drop';
import { DocumentType } from './enums/documentType';
import { FileImportationService } from '../../providers/file-importation.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {

  fileName = 'Escolha o arquivo';
  file: File;
  documentType = DocumentType.CAIXA_MENSAL;

  constructor(private fileImportationService: FileImportationService) { }

  public dropped(event: UploadEvent) {
    const entryFile = event.files[0].fileEntry as FileSystemFileEntry;
    entryFile.file((entry: File) => {
      this.file = entry;
      this.fileName = this.file.name;
    });
  }

  handleFileInput(files: FileList) {
    this.file = files.item(0);
    this.fileName = this.file.name;
  }

  async generateExcel(): Promise<void> {
    console.log(this);
    const path = await this.fileImportationService.generateExcel({ path: this.file.path, documentType: this.documentType });
    console.log(path);
  }

}
