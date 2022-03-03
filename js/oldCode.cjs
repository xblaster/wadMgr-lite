'use strict';

/*eslint-env node */
const jschardet = require("jschardet");

const XLSX = require('xlsx');
const _ = require('underscore');
const moment = require('moment');
const iconv = require('iconv-lite');


//handleFile('20151112/cic J.xls');


function cleanDesc(desc) {
    return desc.replace("SEPA", "")
        .replace("PRLV", "")
        .replace("PAIEMENT", "")
        .replace('RETRAIT', "")
        .replace('PAYMENTS', "")
        .replace("PARIS", "")
        .replace("YUTZ", "")
        .replace("DAB", "")
        .replace("CB", "")
        .replace(/[0-9]*/g, '')
        .replace(/ {2}/g, ' ');
}


function getCaisseDepMapper() {
    return obj => {

        const rawData = obj.rawData;

        const date = moment(rawData[0], "DD/MM/YYYY");

        obj.eventDate = date.format("DD/MM/YYYY")
        obj.description = (rawData[2]).replace(",", "_").replace(";", "_");

        obj.credit = parseFloat(rawData[4]);
        obj.debit = parseFloat(rawData[3])
    };
}

/**
 * class who represent a bank account line
 */
class SheetLine {

    constructor(jsonLine) {
        //console.log("Json");
        this.rawData = [];
        this.lineType = "";

        //Define mapper
        this.mapper = {};
        this.mapper["BNP"] = function bnpMapper(obj) {

            const rawData = obj.rawData;

            const date = moment(new Date(1900, 0, rawData[0] - 1));
            obj.eventDate = date.format("DD/MM/YYYY")
            obj.description = (rawData[2] + " " + rawData[3]).replace(",", "_").replace(";", "_");

            const montant = parseFloat(rawData[4]);

            if (montant > 0) {
                obj.credit = montant;
                obj.debit = '';
            } else {
                obj.debit = -montant;
                obj.credit = '';
            }

        }

        this.mapper["BNP CB"] = function bnpMapper(obj) {

            const rawData = obj.rawData;

            const date = moment(rawData[0], "DD-MM-YYYY");

            obj.eventDate = date.format("DD/MM/YYYY")
            obj.description = (rawData[1]).replace(",", "_").replace(";", "_");

            const montant = parseFloat(rawData[2]);

            if (montant > 0) {
                obj.credit = montant;
                obj.debit = '';
            } else {
                obj.debit = -montant;
                obj.credit = '';
            }
        }

        this.mapper["CAISSE_DEP"] = getCaisseDepMapper()

        this.mapper["UNK"] = function () {
        };

        // console.log(jsonLine);
        for (const key in jsonLine) {
            this.rawData.push(jsonLine[key]);
        }
        this.lineType = this.getLineType();
        this.mapper[this.lineType](this); //launch mapper
    }

    toString() {

        if (this.lineType === "UNK") {
            //console.log(this.rawData);
            const reduced = _.reduce(this.rawData, function (memo, num) {
                return memo + ";" + num.toString();
            }, "");

            return reduced.replace(";", ""); //remove first ";"
        }
        //console.log(JSON.stringify(this));
        let resString = this.lineType + ";" + this.eventDate + ";" + this.description + ";\"" + this.debit.toString().replace(".", ",") + "\";\"" + this.credit.toString().replace(".", ",") + "\"";

        let category
        try {
            category = classifier.classify(cleanDesc(this.description));
        } catch (err) {
            category = "UNKOWN !";
        }

        const encoding = jschardet.detect(resString).encoding.toLowerCase();
        resString = iconv.decode(resString, encoding);
        //console.log( resString+";"+category);
        return resString + ";" + category;

    }

    // return the line type
    getLineType() {
        const cells = this.rawData
        const dateF = moment(new Date(1900, 0, cells[0] - 1)).format("DD-MM-YYYY");

        const bnpMaybeDate = moment(dateF, "DD-MM-YYYY", true);
        const bnpCBMaybeDate = moment(cells[0], "DD-MM-YYYY", true);
        const caisseDepMaybeDate = moment(cells[0], "DD/MM/YYYY", true);

        if (bnpMaybeDate.isValid()) {
            return "BNP";
        }

        if (bnpCBMaybeDate.isValid()) {
            return "BNP CB";
        }

        if (caisseDepMaybeDate.isValid()) {
            return "CAISSE_DEP";
        }

        return "UNK";
    }
}

function handleFile(filename) {
    console.log("File " + filename);
    const workbook = XLSX.readFile(filename);
    for (const z in workbook.SheetNames) {
        const sheetName = workbook.SheetNames[z];
        const worksheet = workbook.Sheets[sheetName];
        handleSheet(worksheet, sheetName, filename);
    }
}


function handleSheet(worksheet, worksheetName, filename) {

    const json = XLSX.utils.sheet_to_json(worksheet, {
        raw: true,
        header: ['date', 'libelle', 'type', 'operation', 'montant']
    });
    const res = _.map(json, handleLine);
    const reduced = _.reduce(res, function (memo, num) {
        return memo + "\n" + num.toString();
    }, "");

    writeSheet(reduced, worksheetName, filename);
}

function writeSheet(content, worksheetName, filename) {
    const fs = require('fs');
    // content = content.replace(/,/g, ';');
    fs.writeFile(filename + "--" + worksheetName + ".csv", content, 'binary', function (err) {
        if (err) {
            return console.log(err);
        }
    });


}

// handle line
const handleLine = function handleLine(line) {
    return new SheetLine(line);
}


exports.handleLine = handleLine;
exports.handleFile = handleFile;
