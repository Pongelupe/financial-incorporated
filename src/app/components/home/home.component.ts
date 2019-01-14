import { Component } from '@angular/core';
import { FileSystemFileEntry, UploadEvent } from 'ngx-file-drop';
import { DocumentType } from './enums/documentType';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {

  fileName = 'Escolha o arquivo';
  file: File;
  documentType = DocumentType.CAIXA_MENSAL;

  constructor() { }

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

  generateExcel(): void {
    console.log(this);
  }

}
