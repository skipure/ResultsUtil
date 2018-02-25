var fs = require('fs'); 
var csv = require('fast-csv');
const puppeteer = require('table-scraper');
const util = require('util');

var OUTPUT = "results";

var startlist = process.argv[2];
var race = process.argv[3];
var url = util.format('http://live-timing.com/race.php?r=%s', race);

// (async () => {
//   const browser = await puppeteer.launch();
//   const page = await browser.newPage();
//   await page.goto(util.format('http://live-timing.com/race.php?r=%s', race));
//   const textContent = await page.evaluate(() => document.querySelector('#resultTable').innerText);
//   console.log(textContent);

//   await browser.close();
// })();

var results = [];
var i=0;

LoadStartList(startlist, function(data){
	//header row
	if (data.Bib == "Bib"){
		data.result1 = "Result 1";
		data.result2 = "Result 1";
		data.combined = "Combined";
	} else {		
		data.result1 = "";
		data.result2 = "";
		data.combined = "";
	}
	//console.log(data);
	results.push(data);
}, function(){
	LoadResults();
});

function getTime(str){
	if (str.indexOf('.')<0) return str;
	return str.substring(0,str.indexOf('.')+3);
}

function LoadResults(){
	var csvStream = csv.createWriteStream({headers: false}),
		writableStream = fs.createWriteStream(OUTPUT+'_'+startlist);

	csvStream.pipe(writableStream);

	var scraper = require('table-scraper');
	scraper
	  .get(url)
	  .then(function(tableData) {
	  	var table = tableData[1];
	  	table.map(function(item){
	  		var x = results.find(r => r.Bib == item['1']);
	  		if (x){
		  		x.result1 = getTime(item['6']);
		  		x.result2 = getTime(item['7']);
		  		x.combined = getTime(item['8']);	
				csvStream.write(x);  			
	  		}			
	  	});
	    /*
	       tableData === 
	        [ 
	          [ 
	            { State: 'Minnesota', 'Capitol City': 'Saint Paul', 'Pop.': '3' },
	            { State: 'New York', 'Capitol City': 'Albany', 'Pop.': 'Eight Million' } 
	          ] 
	        ]
	    */
	  });
}

function LoadStartList(filename, onData, onEnd){
	var headers = ["Bib","Club","First","Last","Year of Birth","USSS Number","Sex (Masters or XC)","Cross Reference 1","Cross Reference 2","SRR","USSA Paid","Payment Method","USSS Paid Note","Registration Note","Racer Process Note","<eor>"];
	LoadCsv(filename, headers, function(data){
	 	if (typeof onData == 'function'){
	 		onData(data);
	 	}
	}, function(){		
	 	if (typeof onEnd == 'function'){
	 		onEnd();
	 	}
	});
}

function LoadCsv(filename, headers, onData, onEnd){
	var stream = fs.createReadStream(filename);
	var i=0;
	csv
	 .fromStream(stream, {headers : headers})
	 .on("data", function(data){
	 	if (typeof onData == 'function'){
	 		onData(data);
	 	}
	 })
	 .on("end", function(){
	 	if (typeof onEnd == 'function'){
	 		onEnd();
	 	}
	});
}
