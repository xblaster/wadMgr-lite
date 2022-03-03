import {isCaisseDepLine, lineToString, openCaisseDepFile, transformLine} from "../js/caisseDepHandling.js";
import * as path from 'path';
import {expect} from "chai";

describe("test caisseDepHandling", function () {
    it("should transform a file in array", async function () {
        var file = "./js/test-assets/testFile.csv"
        const pa = path.resolve(file);

        var result = await openCaisseDepFile(file);
        expect(result).to.be.an('array');
        expect(result[0][0]).to.be.an('string').equals("18/02/22");
    });

    it('should detect if a line is from caissedep or not', function () {
        const arrToDetect = [
            '18/02/22',
            '1802202220220218-10.47.31.073358 -',
            'VIR SEPA CPAM DE MOSELLE - METZ',
            '',
            '+31,68',
            '',
            ''
        ]

        expect(isCaisseDepLine(arrToDetect)).to.be.true;
    })

    it('should detect if a false line is not from caissedep or not', function () {
        const arrToDetect = [
            '18-02-22',
            '1802202220220218-10.47.31.073358 -',
            'VIR SEPA CPAM DE MOSELLE - METZ',
            '',
            '+31,68',
            '',
            ''
        ]

        expect(isCaisseDepLine(arrToDetect)).to.be.false;
    })

    it('should transform a line from caissedep to standard Pauline format', function () {
        const arrToTransform = [
            '18/02/22',
            '1802202220220218-10.47.31.073358 -',
            'VIR SEPA CPAM DE MOSELLE - METZ',
            '',
            '+31,68',
            '',
            ''
        ]

        const expectedResult = [
            'ECUREUIL',
            '18/02/2022',
            'VIR SEPA CPAM DE MOSELLE - METZ',
            '',
            '31,68',
            'UNK',

        ]

        const transformLineResult = transformLine(arrToTransform);

        expect(transformLineResult[0]).equals(expectedResult[0]);
        expect(transformLineResult[1]).equals(expectedResult[1]);
        expect(transformLineResult[2]).equals(expectedResult[2]);
        expect(transformLineResult[3]).equals(expectedResult[3]);
        expect(transformLineResult[4]).equals(expectedResult[4]);
        expect(transformLineResult[5]).equals(expectedResult[5]);
    });

    it('should transform a line2 from caissedep to standard Pauline format', function () {
        const arrToTransform = [
            '27/02/22',
            '1802202220220218-10.47.31.073358 -',
            'VIR SEPA CPAM DE MOSELLE - METZ',
            '-31,68',
            '',
            '',
            ''
        ]

        const expectedResult = [
            'ECUREUIL',
            '27/02/2022',
            'VIR SEPA CPAM DE MOSELLE - METZ',
            '31,68',
            '',
            'UNK',
        ]

        const transformLineResult = transformLine(arrToTransform);

        expect(transformLineResult[0]).equals(expectedResult[0]);
        expect(transformLineResult[1]).equals(expectedResult[1]);
        expect(transformLineResult[2]).equals(expectedResult[2]);
        expect(transformLineResult[3]).equals(expectedResult[3]);
        expect(transformLineResult[4]).equals(expectedResult[4]);
        expect(transformLineResult[5]).equals(expectedResult[5]);
    });

    it('should transform a line from caissedep to string', function () {
        const arrToTransform = [
            '01/01/22',
            '1802202220220218-10.47.31.073358 -',
            'REMUNERATION NETTE',
            '',
            '0,02',
            '',
            ''
        ]

        const expectedResult = 'ECUREUIL;01/01/2022;REMUNERATION NETTE;"";"0,02";UNK';

        const lineToStringResult = lineToString(transformLine(arrToTransform));

        expect(lineToStringResult).equals(expectedResult);
    });
})

