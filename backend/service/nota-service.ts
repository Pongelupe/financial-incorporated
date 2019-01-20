import { Nota } from '../model/nota';

import * as xl from 'excel4node';
import * as util from 'util';
import { App } from 'electron';

const regexDate = /((0[1-9]|[12]\d|3[01])\/(0[1-9]|1[0-2])\/[12]\d{3})/;
const regexMoney = /([0-9]\.?)+,\d{2}/g;
const regexCDITaxes = /([0-9]\.?)+,\d{4}\s%\sCDI/g;
const regexPcg = /((?!0)([0-9]\.?)+|0),\d{4}\s%/g;
const accountRegex = /\d{3}\s?\/\s?\d{3}\s?\/\s?\d{8}\s-\s\d{1}/g;
const cpfCnpjRegex = /([0-9]{2}[\.]?[0-9]{3}[\.]?[0-9]{3}[\/]?[0-9]{4}[-]?[0-9]{2})|([0-9]{3}[\.]?[0-9]{3}[\.]?[0-9]{3}[-]?[0-9]{2})/g;

export class NotaService {

    constructor(private app: App) { }

    async generateNotas(text: string): Promise<{ notas: Nota[], header: any }> {
        const lines = text.split('CAIXA, AQUI O SEU FUTURO ACONTECE!');
        let pageCount = 1;
        const notas: Nota[] = [];
        let header = {};
        lines.forEach(l => {
            if (l.length > 1) {
                const linesSplitted = l.split('\n');
                if (pageCount === 1) {
                    linesSplitted.shift();
                    header = this.generateHeader(linesSplitted);
                }
                linesSplitted.splice(0, 15);
                linesSplitted.pop();
                for (let i = 0; i < linesSplitted.length; i = i + 11) {
                    const tempLines = linesSplitted.slice(0, 11 + i);
                    if (tempLines[0 + i] !== 'Observação') {
                        const dates = tempLines[4 + i].split(regexDate);
                        const valorBase = dates[8].match(regexMoney)[0];
                        const taxasCDI = dates[8].substring(valorBase.length, dates[8].length);
                        const pgtRendBrutoAcum = tempLines[8 + i].match(regexPcg)[0];
                        const pgtRendLiquidAcum = tempLines[8 + i].match(regexPcg)[1];
                        const dtSaldo2 = tempLines[8 + i].match(regexMoney)[3];

                        const nota = {
                            numNota: tempLines[0 + i],
                            dtAplicacao: dates[1],
                            dtVencimento: dates[5],
                            valorBase,
                            taxaAtual: taxasCDI.match(regexCDITaxes)[0],
                            taxaFinal: taxasCDI.match(regexCDITaxes)[1],
                            rendBrutoAcum: tempLines[6 + i].match(regexMoney)[0],
                            pgtRendBrutoAcum,
                            provisaoIR: tempLines[6 + i].match(regexMoney)[1],
                            provisaoIOF: tempLines[8 + i].match(regexMoney)[1],
                            rendLiquidAcum: tempLines[6 + i].match(regexMoney)[2],
                            pgtRendLiquidAcum,
                            dtSaldo1: tempLines[6 + i].match(regexMoney)[3],
                            dtSaldo2: dtSaldo2,
                        } as Nota;
                        notas.push(nota);
                    }
                }
                pageCount++;
            }
        });
        return { notas, header };
    }

    private generateHeader(pageOne: string[]): any {
        return {
            document: pageOne[2],
            agency: pageOne[4].split(accountRegex)[0],
            client: pageOne[6].split(cpfCnpjRegex)[0],
            dt1: pageOne[24].match(regexDate)[0],
            dt2: pageOne[25].match(regexDate)[0]
        };
    }

    private toNumber(formattedNumber: string): number {
        return +formattedNumber.replace('.', '').replace(',', '.');
    }

    async generateExcel(notas: { notas: Nota[]; header: any; }): Promise<string> {
        const wb = new xl.Workbook();
        const ws = wb.addWorksheet(notas.header.document);
        this.prepareColumnWidth(ws);
        this.prepareLayout(wb, ws, notas);
        const path = `${this.app.getPath('downloads')}/${this.prepareFileName(notas.header.dt2)}.xlsx`;
        return new Promise<string>((resolve, reject) => {
            wb.write(path
                , (err, stats) => {
                    console.log(err, stats);
                    if (err) {
                        reject(err);
                    }
                    resolve(path);
                });
        });
    }

    private prepareFileName(date: string): string {
        return `financial_incoporated_${date.slice(3).replace('/', '-')}`;
    }

    prepareLayout(wb: any, ws: any, notas: { notas: Nota[]; header: any; }): void {
        const style = wb.createStyle({
            font: {
                size: 8
            },
            numberFormat: 'R$#,##0.00; (R$#,##0.00); -',
        });
        const styleTitle = wb.createStyle({
            font: {
                size: 8,
                color: '2172d7'
            }
        });
        const styleResult = wb.createStyle({
            font: {
                size: 8,
                bold: true
            },
            numberFormat: 'R$#,##0.00; (R$#,##0.00); -',
        });

        ws.cell(1, 1)
            .string(notas.header.client)
            .style(style);
        ws.cell(3, 5)
            .string(notas.header.document)
            .style({ font: { size: 14, bold: true } });
        ws.cell(4, 4)
            .string(notas.header.agency)
            .style({ font: { size: 10, bold: true } });

        ws.cell(5, 1)
            .string('Nota')
            .style(styleTitle);
        ws.cell(5, 2)
            .string('Aplicação')
            .style(styleTitle);
        ws.cell(5, 3)
            .string('Vencimento')
            .style(styleTitle);
        ws.cell(5, 4)
            .string('Taxa atual')
            .style(styleTitle);
        ws.cell(5, 5)
            .string('Taxa máxima')
            .style(styleTitle);
        ws.cell(5, 6)
            .string(`Valor em ${notas.header.dt1}`)
            .style(styleTitle);
        ws.cell(5, 7)
            .string(`Valor em ${notas.header.dt2}`)
            .style(styleTitle);
        ws.cell(5, 8)
            .string(`Rendimento`)
            .style(styleTitle);
        let rendimentoTotal = 0;
        const notasLength = notas.notas.length;
        for (let i = 0; i < notasLength; i++) {
            const nota = notas.notas[i];
            ws.cell(6 + i, 1)
                .string(nota.numNota)
                .style(style);
            ws.cell(6 + i, 2)
                .string(nota.dtAplicacao)
                .style(style);
            ws.cell(6 + i, 3)
                .string(nota.dtVencimento)
                .style(style);
            ws.cell(6 + i, 4)
                .string(nota.taxaAtual)
                .style(style);
            ws.cell(6 + i, 5)
                .string(nota.taxaFinal)
                .style(style);
            ws.cell(6 + i, 6)
                .string(nota.dtSaldo1)
                .style(style);
            ws.cell(6 + i, 7)
                .string(nota.dtSaldo2)
                .style(style);
            const rendimentoParcial = this.toNumber(nota.dtSaldo2) - this.toNumber(nota.dtSaldo1);
            rendimentoTotal += rendimentoParcial;
            ws.cell(6 + i, 8)
                .number(rendimentoParcial)
                .style(style);
        }

        ws.cell(6 + notasLength, 1)
            .string('Subtotal')
            .style(styleResult);
        ws.cell(6 + notasLength, 6)
            .number(notas.notas.map(n => this.toNumber(n.dtSaldo1)).reduce((acc, current) => acc + current))
            .style(styleResult);
        ws.cell(6 + notasLength, 7)
            .number(notas.notas.map(n => this.toNumber(n.dtSaldo2)).reduce((acc, current) => acc + current))
            .style(styleResult);
        ws.cell(6 + notasLength, 8)
            .number(rendimentoTotal)
            .style(styleResult);
    }

    prepareColumnWidth(ws): void {
        ws.column(1).setWidth(18);
        ws.column(6).setWidth(15);
        ws.column(7).setWidth(15);
        ws.column(8).setWidth(15);
    }

}
