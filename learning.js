var fs = require('fs');
var natural = require('natural'),
 classifier = new natural.BayesClassifier();
 //classifier = new natural.LogisticRegressionClassifier
var _ = require('underscore');

var jschardet = require("jschardet");
var iconv = require('iconv-lite');


function testResult() {

}

function cleanDesc (desc) {

	return desc.replace("SEPA","")
				.replace("PRLV","")
				.replace("PAIEMENT","")
				.replace("RETRAIT","")
				.replace("PAYMENTS","")
				.replace("PARIS","")
				.replace("YUTZ","")
				.replace("THIONVILLE","")
				.replace("BASSE HAM","")
				
				
				.replace("DAB","")
				.replace("CB","")
				.replace(/[0-9]*/g, '')
				.replace(/  /g, ' ');

	return desc.replace(/[0-9]*/g, '')
				.replace(/  /g, ' ').trim();

	
}

function handleLine( line) {
	var cells = line.split(";");


	var category =  _.last(cells);
	var initial = cells[1]+" M"+cells[2]+"M€"+" P"+cells[3]+"P€";
	
	if (initial) {
		initial = cleanDesc(initial);
		//console.log(initial+" | "+category);
		classifier.addDocument(initial, [category]);	
	}
	

}


function getSuccessRating (lines, classifier) {
	var success = 0;
   _.each(lines, function(line) {
   		var cells = line.split(";");
   		var category =  _.last(cells);
		var initial = cells[1]+" M"+cells[2]+"M€"+" P"+cells[3]+"P€";
		if (classifier.classify(cleanDesc(initial)).toLowerCase()==category.toLowerCase()) {
			success++;
		}
   })

   return (success/lines.length);
}

function getLineInError (lines, classifier) {
	var lineInErrors = []
   _.each(lines, function(line) {
   		var cells = line.split(";");
   		var category =  _.last(cells);
		var initial = cells[1]+" M"+cells[2]+"M€"+" P"+cells[3]+"P€";
		if (classifier.classify(cleanDesc(initial)).toLowerCase()!=category.toLowerCase()) {
			lineInErrors.push(line);
		}
   })

   return lineInErrors;
}

fs.readFile('learning.csv', function (err, data) {
	//console.log(data);
    var encoding = jschardet.detect(data).encoding.toLowerCase();
    data = iconv.decode(data, encoding);

   var lines = data.toString().split("\n")



   _.each(lines, function(line) {
   		handleLine(line);
   })

   classifier.train();

   while (getSuccessRating(lines, classifier) < 0.81 ) {
   		console.log("error rate "+(getSuccessRating(lines, classifier)*100));

   		//add new entry to trainer
   		//_.each(getLineInError(lines, classifier), function(line) {
		_.each(lines, function(line) {
   			handleLine(line);
   		});
   		_.each(lines, function(line) {
   			handleLine(line);
   		});
   		_.each(lines, function(line) {
   			handleLine(line);
   		});
   		classifier.train();
   }

	classifier.save('classifier.json', function(err, classifier) {
	    console.log(classifier.classify(cleanDesc('COTISATION PROVISIO 30004 00453 00050909')));
	   console.log(classifier.classify(cleanDesc('VIR CPAM DE MOSELLE - METZ 152290010995 152290010995152290010995')));
	   console.log(classifier.classify(cleanDesc('CB SELECTA GAR ME PSC AUBERVILLIERS')));
	   console.log(classifier.classify(cleanDesc('PRLV SEPA GDF SUEZ 53333705715600050839095520150824 PRELEVEMENT GDF SUEZ - MANDAT 00S009720003')));

	    console.log(jschardet.detect(data).encoding.toLowerCase());
	});


   

   
});