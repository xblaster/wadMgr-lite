'use strict';

/*eslint-env node */
var XLSX = require('xlsx');
var _ = require('underscore');
var moment = require('moment');

var jschardet = require("jschardet");
var iconv = require('iconv-lite');



//handleFile('20151112/cic J.xls');


function cleanDesc (desc) {
	return desc.replace("SEPA","")
				.replace("PRLV","")
				.replace("PAIEMENT","")
				.replace("RETRAIT","")
				.replace("PAYMENTS","")
				.replace("PARIS","")
				.replace("YUTZ","")
				.replace("DAB","")
				.replace("CB","")
				.replace(/[0-9]*/g, '')
				.replace(/  /g, ' ');
}



class SheetLine {

    constructor(jsonLine) {
        //console.log("Json");
        this.rawData = [];
        this.lineType = "";

        //Define mapper 
        this.mapper = {};
        this.mapper["BNP"] = function bnpMapper(obj) {
           
            var rawData = obj.rawData;

            var date = moment(new Date(1900, 0, rawData[0] - 1))
            obj.eventDate = date.format("DD/MM/YYYY")
            obj.description = (rawData[2] + " " + rawData[3]).replace(",", "_").replace(";", "_");

            var montant = parseFloat(rawData[4]);

            if (montant > 0) {
                obj.credit = montant;
                obj.debit = '';
            } else {
                obj.debit = -montant;
                obj.credit = '';
            }

            //console.log(obj);
        }

        this.mapper["BNP CB"] = function bnpMapper(obj) {

            var rawData = obj.rawData;

            var date = moment(rawData[0], "DD-MM-YYYY");

            obj.eventDate = date.format("DD/MM/YYYY")
            obj.description = (rawData[1]).replace(",", "_").replace(";", "_");

            var montant = parseFloat(rawData[2]);

            if (montant > 0) {
                obj.credit = montant;
                obj.debit = '';
            } else {
                obj.debit = -montant;
                obj.credit = '';
            }
        }
  

        this.mapper["UNK"] = function() {};

        var i = 0;
        // console.log(jsonLine);
        for (var key in jsonLine) {
            this.rawData.push(jsonLine[key]);
        }
        //console.log(JSON.stringify(this.rawData));

        this.lineType = this.getLineType();

        this.mapper[this.lineType](this); //launch mapper



        //console.log("line type :" + this.lineType);
    }

    toString() {

        if (this.lineType === "UNK") {
            //console.log(this.rawData);
            var reduced = _.reduce(this.rawData, function(memo, num) {
                return memo + ";" + num.toString();
            }, "");

            return reduced.replace(";", ""); //remove first ";"
        }
        //console.log(JSON.stringify(this));
        var resString =  this.lineType+";"+this.eventDate + ";" + this.description + ";\"" + this.debit.toString().replace(".", ",") + "\";\"" + this.credit.toString().replace(".", ",") + "\"";

        var category
        try {
        	category = classifier.classify(cleanDesc(this.description))	;
        } 
        catch (err) {
        	category = "UNKOWN !";
        }

        var encoding = jschardet.detect(resString).encoding.toLowerCase();
    	resString = iconv.decode(resString, encoding);
        //console.log( resString+";"+category);
        return resString+";"+category;

    }

    getLineType() {
        var cells = this.rawData
        var dateF = moment(new Date(1900, 0, cells[0] - 1)).format("DD-MM-YYYY");
   
        // console.log(cells);
            //var maybeDate = moment.isDate(cells[0]);
            //10/12/15
        // console.log("get line type"+cells[0]);
        var bnpMaybeDate = moment(dateF, "DD-MM-YYYY", true);
        var bnpCBMaybeDate = moment(cells[0], "DD-MM-YYYY", true);
        var cicMaybeDate = moment(cells[1], "M/D/YY", true);
        var cicCBMaybeDate = moment(cells[0], "M/D/YY", true);

        if (bnpMaybeDate.isValid()) {
                return "BNP";
        }

        if (bnpCBMaybeDate.isValid()) {
            return "BNP CB";
    }

        return "UNK";
    }
}


function handleFile(filename) {
    console.log("File " + filename);
    var workbook = XLSX.readFile(filename);
    for (var z in workbook.SheetNames) {
        var sheetName = workbook.SheetNames[z];
        var worksheet = workbook.Sheets[sheetName];
        handleSheet(worksheet, sheetName, filename);
    }
}


var natural = require('natural'),
    classifier = new natural.BayesClassifier();

natural.BayesClassifier.load('classifier.json', null, function(err, classifi) {
	var glob = require("glob");
	classifier = classifi;
	glob("**/*.xls", function(er, files) {
	    //console.log(files);
	    for (var file in files) {
	        handleFile(files[file]);
	    }
	})

});





function handleSheet(worksheet, worksheetName, filename) {
    // console.log("Sheet " + worksheetName);

    //var csv = XLSX.utils.sheet_to_csv(worksheet);
    var json = XLSX.utils.sheet_to_json(worksheet, {raw: true,header: ['date', 'libelle','type','operation','montant']});
    //var csv2 = convertJsonToProperObj(json);


    //var splitedFile = csv2 //csv.split("\n")
    var res = _.map(json, handleLine);
    var reduced = _.reduce(res, function(memo, num) {
        return memo + "\n" + num.toString();
    }, "");
    //console.log(reduced);

    writeSheet(reduced, worksheetName, filename);
}

function writeSheet(content, worksheetName, filename) {
    var fs = require('fs');
    // content = content.replace(/,/g, ';');
    fs.writeFile(filename + "--" + worksheetName + ".csv", content, 'binary', function(err) {
        if (err) {
            return console.log(err);
        }

        console.log("The file was saved!");
    });


}






function formatMontant(montant) {
    return montant.replace(".", ",")
}

function cleanMontant(montant) {
    if (!montant) {
        return;
    }
    return montant.replace(" ", "");
}

function splitMontant(montant) {

    var mnt = parseFloat(cleanMontant(montant));
    if (montant < 0) {
        return "," + (-mnt)
    } else {
        return mnt + ",";
    }
}

function handleLine(line) {

    return new SheetLine(line);


}
