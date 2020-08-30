let fs = require("fs");
var request = require("./requests");
let config = require("./config.json");
let mongoose = require("mongoose");
let matchSchema = new mongoose.Schema({}, {strict: false});
let Match = mongoose.model("Match", matchSchema);
mongoose.connect("mongodb://192.168.2.231:27017/matchDataV3", {useNewUrlParser: true});

let main = async function (){
    let matchList = await getFilteredMatchList(config, request);
    let newMatchId = await getNewMatch(matchList);

    let matchData = await request.getMatchData(newMatchId, config.realm);
    if(matchData.error) {
        console.log(matchData);
        process.exit(1);
    }
    console.log(matchData);

    try {
        let matchEntry = new Match(matchData);
        await matchEntry.save();
    } catch (e) {
        console.log(e);
    }

    config.seedId = getNewSeed(matchData, config.seedId);
    fs.writeFileSync("./config.json", JSON.stringify(config, null, 4), (err) => {
         console.log(err);
    });
    mongoose.disconnect();
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

async function getNewMatch(matchList) {
    console.log("Getting a random matchId");
    let matchId;
    do {
        let randomMatchIndex = getRandomInt(0, matchList.length - 1);
        matchId = matchList[randomMatchIndex].gameId;
        console.log(matchId);
    } while (await checkMatchId(matchId));

    return matchId;
}

async function checkMatchId(matchId) {
    try {
        let match = await Match.findOne({gameId: matchId});
        if(match === null) {
            console.log(false);
            return false;
        } else {
            console.log(true);
            return true;
        }
    }
    catch(err) {
        console.log(err);
    }
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

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
