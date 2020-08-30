let fs = require("fs");
var request = require("./requests");
let jsonMatchData = require("./matchData.json");
let config = require("./config.json");

let main = async function (){
    let matchList = await getFilteredMatchList(config, request);
    let newMatchId = getNewMatch(matchList, jsonMatchData);

    let matchData = await request.getMatchData(newMatchId, config.realm);
    if(matchData.error) {
        console.log(matchData);
        process.exit(1);
    }
    console.log(matchData);
    jsonMatchData.matches.push(matchData);
    jsonMatchData.accountSeeds.push(config.seedId);

    console.log(jsonMatchData.matches.length + ": Games collected with api crawler.");
    fs.writeFileSync("./matchData.json", JSON.stringify(jsonMatchData), (err) => {
        console.log(err);
    });

    config.seedId = getNewSeed(matchData, config.seedId);

    fs.writeFileSync("./config.json", JSON.stringify(config, null, 4), (err) => {
        console.log(err);
    });

}();

async function getFilteredMatchList (config, request){
    console.log("Getting matchlist with some filtering.");
    let start = config.startIndex,
        end   = config.endIndex;

    let lookingForMatchList = true;
    let matchList = [];
    do {
        console.log("Startindex: " + start + " EndIndex: " + end);
        let matchListData = await request.getMatchList(config.seedId, start, end, config.realm);
        if(matchListData.error) {
            process.exit(1);
        }

        let fullmatchList = matchListData.matches;
        matchList = purgeMatchList(fullmatchList, config.approvedQueues, config.realm);
        if(!matchList.length) {
            console.log("Expanding search...");
            start = end;
            end += config.endIndex;
        } else {
            lookingForMatchList = false;
        }
    } while (lookingForMatchList);

    return matchList;
}

function checkMatchId(jsonMatchList, matchId) {
    console.log("Checking MatchId: " + matchId);
    let foundMatch = false;
    jsonMatchList.forEach(function(match) {
        if(matchId === match.gameId) {
            foundMatch = true;
            console.log("Match Id: " + matchId + " Already exists.");
        }
    });
    return foundMatch;
}

function getNewMatch(matchList, jsonMatchData) {
    console.log("Getting a random matchId");
    let matchId;
    do {
        let randomMatchIndex = getRandomInt(0, matchList.length - 1);
        matchId = matchList[randomMatchIndex].gameId;
    } while (checkMatchId(jsonMatchData.matches, matchId));

    return matchId
}

function getNewSeed(matchData, seedId) {
    console.log("Getting new accountSeed for further Crawling");
    let numOfParticipants = matchData.participantIdentities.length;
    let newSeedId;

    do {
        let randomParticipantIndex = getRandomInt(0, numOfParticipants - 1);
        newSeedId = matchData.participantIdentities[randomParticipantIndex].player.currentAccountId;
        console.log(newSeedId);
    } while (seedId === newSeedId);

    return newSeedId;
}

function purgeMatchList(matchList, approvedQueues, realm) {
    console.log("Purging MatchList witch queues: " + approvedQueues + " allowed");
    let newMatchList = [];

    matchList.forEach(function(match) {
        if(approvedQueues.includes(match.queue) && match.platformId.toLowerCase() === realm) {
            newMatchList.push(match);
        }
    });
    return newMatchList;
}



function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
