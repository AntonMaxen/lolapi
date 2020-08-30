let util = require("util");
let request = require("request");
let requestPromise = util.promisify(request);
let apiKey = "RGAPI-b338e5d1-e892-47f5-9591-ec21fbad3fe4";

async function refreshData(summonerName, amountOfMatches) {
    amountOfMatches = (amountOfMatches < 1 || amountOfMatches > 50) ? 10 : amountOfMatches;
    let requestObj = {};

    //get account id.
    let accountResponse = await requestPromise(`https://euw1.api.riotgames.com/lol/summoner/v4/summoners/by-name/${summonerName}?api_key=${apiKey}`);

    if(!accountResponse.aborted && accountResponse.statusCode == 200) {
        let accountData = JSON.parse(accountResponse.body);
        let account_id = accountData.accountId;
        requestObj.accountData = accountData;

        // get match list
        let matchListResponse = await requestPromise(`https://euw1.api.riotgames.com/lol/match/v4/matchlists/by-account/${account_id}?endIndex=${amountOfMatches}&api_key=${apiKey}`);

        if(!matchListResponse.aborted && matchListResponse.statusCode == 200) {
            let matchListData = JSON.parse(matchListResponse.body);
            let match_ids = [];
            let champion_ids = [];
            let counter = 0;
            requestObj.matchListData = matchListData;
            matchListData.matches.forEach(function(match) {
                // if(match.lane !== "NONE" && counter < amountOfMatches) {
                    match_ids.push(match.gameId);
                    champion_ids.push(match.champion);
                    // counter++;
                // }
            });

            // amountOfMatches = (amountOfMatches !== counter) ? counter : amountOfMatches;

            //Get current version.
            let versionResponse = await requestPromise(`https://ddragon.leagueoflegends.com/api/versions.json`);
            if(!versionResponse.aborted && versionResponse.statusCode == 200) {
                let versionData = JSON.parse(versionResponse.body);
                let version = versionData[0];

                //get champ info
                let champResponse = await requestPromise(`http://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion.json`);
                if(!champResponse.aborted && champResponse.statusCode == 200) {
                    let champData = JSON.parse(champResponse.body);
                    let list = Object.keys(champData.data);

                    let matchResults = [];
                    let dataArray = [];
                    for(let i = 0; i < amountOfMatches; i++) {
                        let currentMatchId = match_ids[i];
                        let currentChampId = champion_ids[i];

                        //get match info
                        let matchResponse = await requestPromise(`https://euw1.api.riotgames.com/lol/match/v4/matches/${currentMatchId}?api_key=${apiKey}`);
                        if(!matchResponse.aborted && matchResponse.statusCode == 200) {
                            dataArray[i] = JSON.parse(matchResponse.body);
                            //Looks for player with account_id and gathers information from the matchResponse.body.
                            let matchresult = getMatchResults(dataArray[i], account_id);
                            console.log(matchresult);


                            let currentChampObj;
                            //Get information of the champion player i playing
                            list.forEach(function(champ) {
                                if(champData.data[champ].key == currentChampId) {
                                    currentChampObj = champData.data[champ];
                                }
                            });

                            matchResults.push({
                                index: i,
                                matchId: currentMatchId,
                                matchUrl: `https://matchhistory.euw.leagueoflegends.com/en/#match-details/EUW1/${currentMatchId}/314792?tab=overview`,
                                matchObj: matchresult,
                                championObj: currentChampObj,
                                version: version
                            });
                        } else { return {error: true, requestObj: matchResponse}; }
                    }
                    requestObj.matchResults = matchResults;

                } else { return {error: true, requestObj: champResponse}; }
            } else { return {error: true, requestObj: versionResponse}; }

            return requestObj;

        } else { return {error: true, requestObj: matchListResponse}; }
    } else { return {error: true, requestObj: accountResponse}; }
}

async function getAccount(summonerName) {

}

let getMatchResults = function(data, account_id) {
    let matchObj = {};
    matchObj.gameInfo = {
        gameId: data.gameId,
        platformId: data.platformId,
        gameCreation: data.gameCreation,
        gameDuration: data.gameDuration,
        queueId: data.queueId,
        mapId: data.mapId,
        seasonId: data.seasonId,
        gameVersion: data.gameVersion,
        gameMode: data.gameMode,
        gameType: data.gameType
    };

    //get participant id.
    data.participantIdentities.forEach(function(pID) {
        if(account_id === pID.player.currentAccountId) {
            matchObj.playerInfo = pID.player;
            matchObj.participantId = pID.participantId;

            //get participant team id.
            data.participants.forEach(function(p) {
                if(matchObj.participantId === p.participantId) {
                    matchObj.teamId = p.teamId;
                    matchObj.stats = p.stats;

                    data.teams.forEach(function(t) {
                        if(matchObj.teamId === t.teamId) {
                            matchObj.result = t.win;
                            matchObj.teams = t;
                        }
                    });
                    matchObj.participants = p;
                }
            });
            matchObj.participantIdentities = pID;
        }
    });
    return matchObj;
}
module.exports.refreshData = refreshData;

// //gather participantIdentities array
// data.participantIdentities.forEach(function(pid) {
//     let summonerId = pid.player.summonerId;
//     let accountId = pid.player.accountId;
//     let currentAccountId = pid.player.currentAccountId;
//     let summonerName = pid.player.summonerName;
//     let playerId = pid.participantId;
//     participantIdentities.push({
//         summonerId: summonerId,
//         accountId: accountId,
//         currentAccountId: currentAccountId,
//         playerId: playerId,
//         summonerName: summonerName
//     });
// });
// //gatcher participant array
// data.participants.forEach(function(p) {
//     let playerId = p.participantId;
//     let teamId = p.teamId;
//     let stats = p.stats;
//     participants.push({
//         playerId: playerId,
//         teamId: teamId,
//         stats: stats
//     });
// });
//
// //gatcher team array
// data.teams.forEach(function(t) {
//     let teamId = t.teamId;
//     let result = t.win;
//     teams.push({
//         teamId: teamId,
//         result: result
//     });
// });
