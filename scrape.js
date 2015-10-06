var express = require('express');
var request = require('request');
var cheerio = require('cheerio');
var Firebase = require("firebase");

var week = 3;
var last_day = 3;
var url = "http://www.cbssports.com/collegefootball/scoreboard/FBS/2015/week";
var myFirebaseRef = new Firebase("https://spreadem.firebaseio.com/");


performScrape();
setInterval(performScrape, 60000);  // 1 min
	


function whatDayIsIt () {
	var date = new Date();
	return date.getDay();
}

function performScrape() {
	console.log("running scrape");
	
	if (whatDayIsIt() === 3 && last_day !== 3) {
		console.log("its wednesday, time for a new week!");
		last_day = 3;
		week++;
	}
	
	loadPreEventData(week);

	//loadLiveEventData(week);

	loadPostEventData(week);
	
}


function loadPreEventData (week) {
	
	request(url+week, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			//var pre_html = "<table class='lineScore preEvent'><tbody><tr class='gameInfo'><td class='gameStatus'>Thurs.  Oct. 1 - 7:30 pm ET (ESPN)</td><td class='gameOdds'>Line</td></tr><tr class='teamInfo awayTeam NCAAFMIAMI '><td class='teamName'><a href='/collegefootball/teams/page/MIAMI'><img src='/images/collegefootball/logos/25x25/MIAMI.png' width='25' height='25' border='0' class='teamLogo'></a><div class='teamLocation'><a href='/collegefootball/teams/page/MIAMI'>Miami (Fla.)</a><div class='teamRecord'>(3-0)</div></div></td><td class='gameOdds'>68.0 O/U</td></tr><tr class='teamInfo homeTeam NCAAFCINCY '><td class='teamName'><a href='/collegefootball/teams/page/CINCY'><img src='/images/collegefootball/logos/25x25/CINCY.png' width='25' height='25' border='0' class='teamLogo'></a><div class='teamLocation'><a href='/collegefootball/teams/page/CINCY'>Cincinnati</a><div class='teamRecord'>(2-2)</div></div></td><td class='gameOdds'>+6.5</td></tr></tbody></table><table class='lineScore preEvent'><tbody><tr class='gameInfo'><td class='gameStatus'>Fri.  Oct. 2 - 7:30 pm ET (ESPN)</td><td class='gameOdds'>Line</td></tr><tr class='teamInfo awayTeam NCAAFMIAMI '><td class='teamName'><a href='/collegefootball/teams/page/MIAMI'><img src='/images/collegefootball/logos/25x25/MIAMI.png' width='25' height='25' border='0' class='teamLogo'></a><div class='teamLocation'><a href='/collegefootball/teams/page/MIAMI'>Tennessee</a><div class='teamRecord'>(3-0)</div></div></td><td class='gameOdds'>68.0 O/U</td></tr><tr class='teamInfo homeTeam NCAAFCINCY '><td class='teamName'><a href='/collegefootball/teams/page/CINCY'><img src='/images/collegefootball/logos/25x25/CINCY.png' width='25' height='25' border='0' class='teamLogo'></a><div class='teamLocation'><a href='/collegefootball/teams/page/CINCY'>Florida</a><div class='teamRecord'>(2-2)</div></div></td><td class='gameOdds'>+6.5</td></tr></tbody></table>";	
			var $ = cheerio.load(body);
	
			var weekRef = myFirebaseRef.child("weeks/"+week);
			var i = 0;
			$('table.lineScore.preEvent').each(function(){
				var game_date = $(this).find('tr.gameInfo td .gameDate').text();
				var away_team = $(this).find('tr.teamInfo.awayTeam div.teamLocation a').text();
				var home_team = $(this).find('tr.teamInfo.homeTeam div.teamLocation a').text();
				var odds = parseFloat($(this).find('tr.teamInfo.homeTeam td.gameOdds').text()) || 0;
				
				if ( i == 0 ) {
					// save first date
					weekRef.update({"firstDate" : game_date});
				}
				i++;

				//save last date found
				weekRef.update({"firstDate" : game_date});
				
				//save the game info using the home team as the key
				var gameRef = myFirebaseRef.child("games/week"+week+"/"+escapeFirebaseKey(home_team));
				gameRef.update({
					"date" 		: game_date,
					"away" 		: away_team,
					"home" 		: home_team,
					"odds" 		: odds,
					"finished" 	: false
				});
			});
			
		} else {
			console.log("loadPreEventData: We’ve encountered an error: " + error);
		}
	});
}

function loadLiveEventData (week) {
	
	request(url+week, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			//var live_html = "<table class='lineScore postEvent'><tbody><tr class='gameInfo'><td class='gameStatus'><span class='gmtTimeUpdated' data-gmt='1443137400' data-gmt-format='%r  %q %e'>Thurs.  Sept. 24</span></td><td class='finalStatus' colspan='5'>Final</td></tr><tr class='teamInfo awayTeam'><td class='teamName'><a href='/collegefootball/teams/page/CINCY/cincinnati-bearcats'><img delaysrc='http://sports.cbsimg.net/images/collegefootball/logos/25x25/CINCY.png' width='25' height='25' border='0' class='teamLogo'></a><div class='teamLocation'><a href='/collegefootball/teams/page/CINCY/cincinnati-bearcats'>Miami (Fla.)</a><div class='teamRecord'>(3-0)</div></div></td><td class='periodScore'>10</td><td class='periodScore'>20</td><td class='periodScore'>3</td><td class='periodScore'>13</td><td class='finalScore'>46</td></tr><tr class='teamInfo homeTeam'><td class='teamName'><a href='/collegefootball/teams/page/MEMP/memphis-tigers'><img delaysrc='http://sports.cbsimg.net/images/collegefootball/logos/25x25/MEMP.png' width='25' height='25' border='0' class='teamLogo'></a><div class='teamLocation'><a href='/collegefootball/teams/page/MEMP/memphis-tigers'>Cincinnati</a><div class='teamRecord'>(2-2)</div></div></td><td class='periodScore'>14</td><td class='periodScore'>14</td><td class='periodScore'>3</td><td class='periodScore'>22</td><td class='finalScore'>53</td></tr></tbody></table>";
	  		var $ = cheerio.load(body);
	
			$('table.lineScore.liveEvent').each(function(){
				var away_score = $(this).find('tr.teamInfo.awayTeam td.finalScore').text();
				var home_team = $(this).find('tr.teamInfo.homeTeam div.teamLocation a').text();
				var home_score = $(this).find('tr.teamInfo.homeTeam td.finalScore').text();
				
				var gameRef = myFirebaseRef.child("games/week"+week+"/"+escapeFirebaseKey(home_team));
				gameRef.update({
					"awayScore" : away_score,
					"homeScore" : home_score
				})


			})
		} else {
			console.log("loadLiveEventData: We’ve encountered an error: " + error);
		}
	});
}

function loadPostEventData (week) {
	
	request(url+week, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			//var post_html = "<table class='lineScore postEvent'><tbody><tr class='gameInfo'><td class='gameStatus'><span class='gmtTimeUpdated' data-gmt='1443137400' data-gmt-format='%r  %q %e'>Thurs.  Sept. 24</span></td><td class='finalStatus' colspan='5'>Final</td></tr><tr class='teamInfo awayTeam'><td class='teamName'><a href='/collegefootball/teams/page/CINCY/cincinnati-bearcats'><img delaysrc='http://sports.cbsimg.net/images/collegefootball/logos/25x25/CINCY.png' width='25' height='25' border='0' class='teamLogo'></a><div class='teamLocation'><a href='/collegefootball/teams/page/CINCY/cincinnati-bearcats'>Miami (Fla.)</a><div class='teamRecord'>(3-0)</div></div></td><td class='periodScore'>10</td><td class='periodScore'>20</td><td class='periodScore'>3</td><td class='periodScore'>13</td><td class='finalScore'>46</td></tr><tr class='teamInfo homeTeam'><td class='teamName'><a href='/collegefootball/teams/page/MEMP/memphis-tigers'><img delaysrc='http://sports.cbsimg.net/images/collegefootball/logos/25x25/MEMP.png' width='25' height='25' border='0' class='teamLogo'></a><div class='teamLocation'><a href='/collegefootball/teams/page/MEMP/memphis-tigers'>Cincinnati</a><div class='teamRecord'>(2-2)</div></div></td><td class='periodScore'>14</td><td class='periodScore'>14</td><td class='periodScore'>3</td><td class='periodScore'>22</td><td class='finalScore'>53</td></tr></tbody></table>";	
			var $ = cheerio.load(body);
	
			$('table.lineScore.postEvent').each(function(){
				var away_score = $(this).find('tr.teamInfo.awayTeam td.finalScore').text();
				var home_team = $(this).find('tr.teamInfo.homeTeam div.teamLocation a').text();
				var home_score = $(this).find('tr.teamInfo.homeTeam td.finalScore').text();

				var gameRef = myFirebaseRef.child("games/week"+week+"/"+escapeFirebaseKey(home_team));
				gameRef.update({
					"away" 		: away_team,
					"home" 		: home_team,
					"awayScore" : away_score,
					"homeScore" : home_score,
					"finished"	: true
				})

			})
		} else {
			console.log("loadPostEventData: We’ve encountered an error: " + error);
		}
	});
}


function escapeFirebaseKey(data) {
  if (!data) return false

  // Replace '.' (not allowed in a Firebase key) with ',' 
  data = data.replace(/\./g, ',');
  return data;
}