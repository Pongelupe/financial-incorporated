import { app, BrowserWindow, screen, ipcMain } from 'electron';
import * as path from 'path';
import * as url from 'url';
import * as pdf from 'pdf-parse';
import { readFileSync } from 'fs';
import { Nota } from './backend/model/nota';

let win, serve;
const args = process.argv.slice(1);
serve = args.some(val => val === '--serve');

function createWindow() {

  const electronScreen = screen;
  const size = electronScreen.getPrimaryDisplay().workAreaSize;

  // Create the browser window.
  win = new BrowserWindow({
    x: 0,
    y: 0,
    width: size.width,
    height: size.height
  });

  if (serve) {
    require('electron-reload')(__dirname, {
      electron: require(`${__dirname}/node_modules/electron`)
    });
    win.loadURL('http://localhost:4200');
  } else {
    win.loadURL(url.format({
      pathname: path.join(__dirname, 'dist/index.html'),
      protocol: 'file:',
      slashes: true
    }));
  }

  win.webContents.openDevTools();

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store window
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null;
  });

}

try {

  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  app.on('ready', createWindow);

  ipcMain.on('generateExcel', async (event, payload: { path: string, documentType: DocumentType }) => {
    console.log(payload);
    const buffer = readFileSync(payload.path);
    const data = await pdf(buffer);
    const regexDate = /((0[1-9]|[12]\d|3[01])\/(0[1-9]|1[0-2])\/[12]\d{3})/
    const regexMoney = /([0-9]\.?)+,\d{2}/
    const regexCDITaxes = /([0-9]\.?)+,\d{4}\s%\sCDI/g
    console.log(data.info);
    const lines = data.text.split('CAIXA, AQUI O SEU FUTURO ACONTECE!');
    let pageCount = 0;
    lines.forEach(l => {
      if (l.length > 1) {
        const linesSplitted = l.split('\n');
        if (pageCount === 0) {
          linesSplitted.shift();
        }
        const dates = linesSplitted[19].split(regexDate);
        const valorBase = dates[8].match(regexMoney)[0];
        const taxasCDI = dates[8].substring(valorBase.length, dates[8].length);

        const nota = {
          numNota: linesSplitted[15],
          dtAplicacao: dates[1],
          dtVencimento: dates[5],
          valorBase,
          taxaAtual: taxasCDI.match(regexCDITaxes)[0],
          taxaFinal: taxasCDI.match(regexCDITaxes)[1],
          rendBrutoAcum: '',
          pgtRendBrutoAcum: '',
          provisaoIR: '',
          provisaoIOF: '',
          rendLiquidAcum: '',
          pgtRendLiquidAcum: '',
          dtSaldo1: '',
          dtSaldo2: '',
        } as Nota;

        console.log(pageCount++, nota);
      }
    });
  });

  // Quit when all windows are closed.
  app.on('window-all-closed', () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
      createWindow();
    }
  });

} catch (e) {
  // Catch Error
  // throw e;
}
