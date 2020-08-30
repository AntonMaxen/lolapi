let util = require("util");
let request = require("request");
let requestPromise = util.promisify(request);
let apiKey = "RGAPI-3c41486b-dffd-475d-a2b6-b2b18cb18a4a";

//******************************************//
//************Help Functions****************//
//******************************************//

exports.getAccountBySummonerName = async function (summonerName, realm) {
    summonerName = encodeURI(summonerName);
    console.log("Getting AccountData for: " + summonerName);
    let accountResponse = await requestPromise(`https://${realm}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${summonerName}?api_key=${apiKey}`);
    if(!accountResponse.aborted && accountResponse.statusCode == 200) {
        let accountData = JSON.parse(accountResponse.body);
        accountData.realm = realm;
        return accountData;
    } else {
        return {error: true, requestObj: accountResponse};
    }
}

exports.getAccountByAccountId = async function (account_id, realm) {
    console.log("Getting AccountData for accountId: " + account_id);
    let accountResponse = await requestPromise(`https://${realm}.api.riotgames.com/lol/summoner/v4/summoners/by-account/${account_id}?api_key=${apiKey}`);
    if(!accountResponse.aborted && accountResponse.statusCode == 200) {
        let accountData = JSON.parse(accountResponse.body);
        accountData.realm = realm;
        return accountData;
    } else {
        return {error: true, requestObj: accountResponse};
    }
}

exports.getMatchList = async function (account_id, startIndex, endIndex, realm) {
    console.log("Getting MatchList for account id: " + account_id + " Matches: " + startIndex + "-" + endIndex);
    let matchListResponse = await requestPromise(`https://${realm}.api.riotgames.com/lol/match/v4/matchlists/by-account/${account_id}?endIndex=${endIndex}&beginIndex=${startIndex}&api_key=${apiKey}`);
    if(!matchListResponse.aborted && matchListResponse.statusCode == 200) {
        let matchListData = JSON.parse(matchListResponse.body);
        return matchListData;
    } else {
        return {error: true, requestObj: matchListResponse};
    }
}

exports.getMatchData = async function (match_id, realm) {
    console.log("Getting matchData for matchId: " + match_id);
    let matchResponse = await requestPromise(`https://${realm}.api.riotgames.com/lol/match/v4/matches/${match_id}?api_key=${apiKey}`);
    if(!matchResponse.aborted && matchResponse.statusCode == 200) {
        let matchData = JSON.parse(matchResponse.body);
        return matchData;
    } else {
        return {error: true, requestObj: matchResponse};
    }
}

exports.getTimelineData = async function (match_id, realm) {
    console.log("Getting timelineData for matchId: " + match_id);
    let timelineResponse = await requestPromise(`https://${realm}.api.riotgames.com/lol/match/v4/timelines/by-match/${match_id}?api_key=${apiKey}`);
    if(!timelineResponse.aborted && timelineResponse.statusCode == 200) {
        let timelineData = JSON.parse(timelineResponse.body);
        return timelineData;
    } else {
        return {error: true, requestObj: timelineResponse};
    }
}

exports.getChampionMasteries = async function (summoner_id, realm) {
    console.log("Getting champion masteries by summonerId: " + summoner_id);
    let championMasteryResponse = await requestPromise(`https://${realm}.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-summoner/${summoner_id}?api_key=${apiKey}`);
    if(!championMasteryResponse.aborted && championMasteryResponse.statusCode == 200) {
        let championMasteryData = JSON.parse(championMasteryResponse.body);
        return championMasteryData;
    } else {
        return {error: true, requestObj: championMasteryResponse};
    }
}

exports.getTotalMasteryLevel = async function (summoner_id, realm) {
    console.log("Getting total mastery Level by summonerId: " + summoner_id);
    let totalMasteryLevelResponse = await requestPromise(`https://${realm}.api.riotgames.com/lol/champion-mastery/v4/scores/by-summoner/${summoner_id}?api_key=${apiKey}`);
    if(!totalMasteryLevelResponse.aborted && totalMasteryLevelResponse.statusCode == 200) {
        let totalMasteryData = JSON.parse(totalMasteryLevelResponse.body);
        return totalMasteryData;
    } else {
        return {error: true, requestObj: totalMasteryLevelResponse};
    }
}

////////////////////////////////////////////////
//Static Api//
////////////////////////////////////////////////

exports.getCurrentVersion = async function () {
    console.log("Getting Current Version:");
    let versionResponse = await requestPromise(`https://ddragon.leagueoflegends.com/api/versions.json`);
    if(!versionResponse.aborted && versionResponse.statusCode == 200) {
        let versionData = JSON.parse(versionResponse.body);
        let version = versionData[0];
        return version;
    } else {
        return {error: true, requestObj: versionResponse};
    }
}

exports.getAllChampionsData = async function (version) {
    console.log("Getting static-AllchampionData by version: " + version);
    let champResponse = await requestPromise(`http://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion.json`);
    if(!champResponse.aborted && champResponse.statusCode == 200) {
        let champData = JSON.parse(champResponse.body);
        return champData;
    } else {
        return {error: true, requestObj: champResponse};
    }
}

exports.getSpecificChampionData = async function (version, championName) {
    console.log("Getting specific ChampionData for: " + championName);
    let champResponse = await requestPromise(`http://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion/${championName}.json`)
    if(!champResponse.aborted && champResponse.statusCode == 200) {
        let champData = JSON.parse(champResponse.body);
        return champData;
    } else {
        return {error: true, requestObj: champResponse};
    }
}

exports.getSummonerspellData = async function (version) {
    console.log("Getting static-SummonerSpells by version: " + version);
    let summonerResponse = await requestPromise(`http://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/summoner.json`);
    if(!summonerResponse.aborted && summonerResponse.statusCode == 200) {
        let summonerData = JSON.parse(summonerResponse.body);
        return summonerData;
    } else {
        return {error: true, requestObj: summonerResponse};
    }
}

exports.getItemData = async function (version) {
    console.log("Getting static-Items by version: " + version);
    let itemResponse = await requestPromise(`http://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/item.json`);
    if(!itemResponse.aborted && itemResponse.statusCode == 200) {
        let itemData = JSON.parse(itemResponse.body);
        return itemData;
    } else {
        return {error: true, requestObj: itemResponse};
    }
}
////////////////////////////////////////////
