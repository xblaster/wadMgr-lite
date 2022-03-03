import glob from "glob";
import * as path from "path";
import {parse} from 'csv-parse';

import {createReadStream} from 'fs';
import moment from "moment";

// handle all file from caissedep export
// this function use glob to list all files with .dep.csv extension
export function handleCaisseDepsFiles() {
    const files = glob.sync('./**/*.dep.csv');
    files.forEach(function (file) {
        const fileName = path.basename(file);
        openCaisseDepFile(fileName);
    })
}

// open csv file from caissedep and analyse each line
export function openCaisseDepFile(file) {
    const records = [];
    // Initialize the parser
    const parser = parse({
        delimiter: ';'
    });

    return new Promise((resolve, reject) => {
        // Use the writable stream api
        createReadStream(file)
            .pipe(parse({delimiter: ';'}))
            .on('data', function (csvrow) {
                records.push(csvrow);
            })
            .on('error', reject)
            .on('end', function () {
                resolve(records);
            });

    });
}

// detect if a line is from caisse d'epargne or not
export function isCaisseDepLine(array) {
    return (moment(array[0], "DD/MM/YY", true)).isValid();
}

// transform line from caisse d'epargne to standad Pauline format
export function transformLine(line) {

    let result = [];
    result.push("ECUREUIL");

    result.push(moment(line[0], "DD/MM/YY", true).format("DD/MM/YYYY"));
    result.push(line[2]);

    result.push(line[3].replace("-", ""));
    result.push(line[4].replace("+", ""));
    result.push("UNK");

    return result;
}


export function lineToString(line) {
    // deep copy line param
    let lineCopy = JSON.parse(JSON.stringify(line));
    lineCopy[3] = '"' + lineCopy[3] + '"';
    lineCopy[4] = '"' + lineCopy[4] + '"';
    return lineCopy.join(";");
}
