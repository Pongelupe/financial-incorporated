import { Nota } from '../model/nota';

const regexDate = /((0[1-9]|[12]\d|3[01])\/(0[1-9]|1[0-2])\/[12]\d{3})/;
const regexMoney = /([0-9]\.?)+,\d{2}/g;
const regexCDITaxes = /([0-9]\.?)+,\d{4}\s%\sCDI/g;
const regexPcg = /((?!0)([0-9]\.?)+|0),\d{4}\s%/g;

export class NotaService {

    generateNotas(text: string): Nota[] {
        const lines = text.split('CAIXA, AQUI O SEU FUTURO ACONTECE!');
        let pageCount = 1;
        const notas: Nota[] = [];
        lines.forEach(l => {
            if (l.length > 1) {
                const linesSplitted = l.split('\n');
                if (pageCount === 1) {
                    linesSplitted.shift();
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
        return notas;
    }

}
