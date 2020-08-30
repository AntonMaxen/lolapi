let fs = require("fs");
var request = require("./requests");
let jsonMatchData = require("./matchData.json");

let matches = jsonMatchData.matches;
let accountSeeds = jsonMatchData.accountSeeds;
async function main() {
    let version = await request.getCurrentVersion();
    let championData = await request.getAllChampionsData(version);
    let champNameList = Object.keys(championData.data);
    let championStatObj = {};

    champNameList.forEach(function(champ) {
        let key = championData.data[champ].key;
        let name = championData.data[champ].id;
        championStatObj[key] = {};
        championStatObj[key].name = name;
        championStatObj[key].matches = [];
        championStatObj[key].wins = 0;
        championStatObj[key].losses = 0;
    });

    let keyIds = Object.keys(championStatObj);


    //Looking what to save
    matches.forEach(function(match) {
        match.participants.forEach(function(participant) {
            let currentChampObj = {};
            let currentChampId = participant.championId;
            currentChampObj.stats = participant.stats;
            if(currentChampObj.stats.win == true) {
                championStatObj[currentChampId].wins++;
            } else {
                championStatObj[currentChampId].losses++;
            }

            championStatObj[currentChampId].matches.push(currentChampObj);
        });
    });


    let championInfoList = [];
    champNameList.forEach(function(champ) {
        let tempChampObj = {};
        let key = championData.data[champ].key;
        let wins = championStatObj[key].wins;
        let losses = championStatObj[key].losses;
        let name = championStatObj[key].name;
        let winrate = Math.floor((wins / (wins + losses)) * 100);
        tempChampObj.name = name;
        tempChampObj.id = key;
        tempChampObj.wins = wins;
        tempChampObj.losses = losses;
        tempChampObj.winrate = winrate;
        championInfoList.push(tempChampObj);
    });

    let finalObject = {};
    finalObject.numOfMatches = matches.length;
    finalObject.champions = championInfoList;



    fs.writeFileSync("championStats.json", JSON.stringify(finalObject, null, 4), (err) => {
        console.log(err);
    });
    // console.log(championStatObj);
}









main();


// for(let y = 0; y < accountSeeds.length; y++) {
//     for(let x = y + 1; x < accountSeeds.length; x++) {
//         if(accountSeeds[y] == accountSeeds[x]) {
//             // console.log("found match accountseed" + y  + ": "+ accountSeeds[y] + " = accountseed" + x + ": " + accountSeeds[x]);
//         }
//     }
// }
//
// matches.forEach(function(match) {
//     // console.log(match.gameId);
// });



let linkChampion = function(allChampionsData, champion_id) {
    console.log("linking champion data with championID: " + champion_id);
    let currentChampObj = {};
    //get a list of champions to search for.


    return currentChampObj;
}

// console.log(matches[0]);
