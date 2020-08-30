let util = require("util");
let request = require("request");
let requestPromise = util.promisify(request);
let apiKey = "RGAPI-4dfc2b71-cb2c-4597-b711-a6bc87c0cfc3";
let realmList = ["ru", "kr", "br1", "oc1", "jp1", "na1", "eun1", "euw1", "tr1", "la1", "la2"];

async function getMatchHistory(summonerName, startIndex, endIndex, realm, account_id = false) {
    if(endIndex - startIndex > 100 || endIndex - startIndex < 1) {
        endIndex = startIndex + 10;
    }

    //check realm if it exists
    if(!checkRealm(realm, realmList)) {
        return {error: true};
    }

    let requestObj = {};
    let accountData = {};
    if(!account_id) {
        //get accountinformation by summonername
        accountData = await getAccountBySummonerName(summonerName, realm);
        if(accountData.error) return accountData;
        account_id = accountData.accountId;
    } else {
        //get accountinformation by accountId
        accountData = await getAccountByAccountId(account_id, realm);
        if(accountData.error) return accountData;
    }


    //Get matchList by accountId
    let matchListData = await getMatchList(account_id, startIndex, endIndex, realm);
    if(matchListData.error) return matchListData;
    let amountOfMatches = matchListData.endIndex - matchListData.startIndex;
    //Get current version.
    let version = await getCurrentVersion();
    if(version.error) return version;

    //get champ info
    let allChampionsData = await getAllChampionsData(version);
    if(allChampionsData.error) return allChampionsData;

    let summonerspellData = await getSummonerspellData(version);
    if(summonerspellData.error) return summonerspellData;

    //console.log(sumspellNameList);
    let itemData = await getItemData(version);
    if(itemData.error) return itemData;
    // console.log(itemNameList);

    let matchResults = [];
    console.log("Getting matchData for: " + amountOfMatches + " matches.");
    for(let i = 0; i < amountOfMatches; i++) {
        console.log("start: " + i);
        let currentMatchId = matchListData.matches[i].gameId;
        let currentChampId = matchListData.matches[i].champion;

        //get matchdata
        let matchData = await getMatchData(currentMatchId, realm);
        if(matchData.error) return matchData;

        //Filter Match data.
        let matchResult = filterMatchResult(matchData, account_id);

        //***************************//
        //link functions is used to link static data with specific dynamic data.
        //***************************//

        //link summonerspells
        let spellIds = [matchResult.spells.spellOneId, matchResult.spells.spellTwoId];
        let summonerSpells = linkSummonerSpells(spellIds, summonerspellData);
        //link items
        let itemIds = [
            matchResult.stats.item0,
            matchResult.stats.item1,
            matchResult.stats.item2,
            matchResult.stats.item3,
            matchResult.stats.item4,
            matchResult.stats.item5

        ];
        let items = linkItems(itemIds, itemData);
        //link champion
        let currentChampObj = linkChampion(allChampionsData, currentChampId);


        //*************************//
        //****SkillOrder**********//
        //*************************//
        //if useing timeLineData pass fullchampionObj: fullChampObj into mashResults and matchFrameData: matchTimelineData.
        let useTimeLineData = false;
        //Get information of the champion player is playing
        let matchTimelineData = {};
        let fullChampObj = {};
        if(useTimeLineData) {
            //Get timelinedata
            let timelineData = await getTimelineData(currentMatchId, realm);
            if(timelineData.error) return timelineData;

            //filter data and events by participant id.
            let currentParticipantId = matchResult.participantId;
            matchTimelineData = filterMatchInformationByParticipantId(timelineData, currentParticipantId);

            let currentChampionName = currentChampObj.id;
            console.log(currentChampionName);
            let championResponse = await getSpecificChampionData(version, currentChampionName);
            if(championResponse.error) return championResponse;

            //building skillorder
            fullChampObj = championResponse.data[currentChampionName];

            let qwerArray = ["q", "w", "e", "r"];
            console.log("-__-");
            for(let index = 0; index < matchTimelineData.skillOrder.length; index++) {
                let skillIndex = matchTimelineData.skillOrder[index].skillSlot - 1;
                matchTimelineData.skillOrder[index].id = fullChampObj.spells[skillIndex].id;//[]);
                matchTimelineData.skillOrder[index].image = fullChampObj.spells[skillIndex].image.full;
                matchTimelineData.skillOrder[index].keyName = qwerArray[skillIndex];
            }
            console.log("^_^")
        }

        //*************************//
        //****End SkillOrder*******//
        //*************************//



        matchResults.push({
            index: i,
            matchId: currentMatchId,
            matchUrl: `https://matchhistory.euw.leagueoflegends.com/en/#match-details/EUW1/${currentMatchId}/314792?tab=overview`,
            matchObj: matchResult,
            matchOverviewObj: matchListData.matches[i],
            championObj: currentChampObj,
            fullchampionObj: fullChampObj,
            matchFrameData: matchTimelineData,
            summonerSpells: summonerSpells,
            items: items,
            version: version
        });
        console.log("finish: " + i);
        console.log("-----------------------------------------------------------");
    }
    requestObj.accountData = accountData;
    // requestObj.matchList = matchListData;
    requestObj.matchResults = matchResults;

    return requestObj;
}

async function getMatchSummary(match_id, realm) {
    if(!checkRealm(realm, realmList)) {
        return {error: true};
    }

    let version = await getCurrentVersion();
    if(version.error) return version;

    let allChampionsData = await getAllChampionsData(version);
    if(allChampionsData.error) return allChampionsData;

    let summonerspellData = await getSummonerspellData(version);
    if(summonerspellData.error) return summonerspellData;

    let itemData = await getItemData(version);
    if(itemData.error) return itemData;


    let matchData = await getMatchData(match_id, realm);
    if(matchData.error) return matchData;

    let timelineData = await getTimelineData(match_id, realm);
    if(timelineData.error) return timelineData;

    let matchObj = {
        gameId: matchData.gameId,
        platformId: matchData.platformId,
        gameCreation: matchData.gameCreation,
        gameDuration: matchData.gameDuration,
        queueId: matchData.queueId,
        mapId: matchData.mapId,
        seasonId: matchData.seasonId,
        gameVersion: matchData.gameVersion,
        gameMode: matchData.gameMode,
        gameType: matchData.gameType,
    };

    let teamArray = [];
    matchData.teams.forEach(function(team) {
        let participantArray = [];
        let participantObj = {}
        matchData.participants.forEach(function(participant) {
            if(participant.teamId == team.teamId) {
                participantObj = participant;
                //filter timeLineData
                let currentParticipantId = participantObj.participantId;
                participantObj.timelineData = filterMatchInformationByParticipantId(timelineData, currentParticipantId);
                //Link ChampionData
                let currentChampId = participantObj.championId;
                participantObj.champion = linkChampion(allChampionsData, currentChampId);
                //link itemData
                let itemIds = [
                    participantObj.stats.item0,
                    participantObj.stats.item1,
                    participantObj.stats.item2,
                    participantObj.stats.item3,
                    participantObj.stats.item4,
                    participantObj.stats.item5,
                ];
                participantObj.items = linkItems(itemIds, itemData);
                //link spells
                let spellIds = [participantObj.spell1Id, participantObj.spell2Id];
                participantObj.summonerSpells = linkSummonerSpells(spellIds, summonerspellData);

                matchData.participantIdentities.forEach(function(participantIdentities) {
                    if(participantIdentities.participantId == participant.participantId) {
                        participantObj.player = participantIdentities.player;
                    }
                });
                participantArray.push(participantObj);
            }
        });
        teamArray.push({
            participants: participantArray,
            team: team
        });
    });
    matchObj.teams = teamArray;

    return matchObj;
}

async function getAccountsCrossRealms(summonerName) {
    let accountObj = {};
    let accounts = [];

    for(let i = 0; i < realmList.length; i++) {
        console.log(realmList[i]);
        let accountData = await getAccountBySummonerName(summonerName, realmList[i]);
        if(!accountData.error) {
            accounts.push(accountData);
        }
    }
    if(accounts.length < 1) {
        return {error: true};
    }

    let version = await getCurrentVersion();
    if(version.error) return version;

    accountObj.version = version;
    accountObj.accounts = accounts;

    return accountObj;
}

async function getProfile(summonerName, realm, account_id = false) {
    let profileObj = {};

    if(!checkRealm(realm, realmList)) {
        return {error: true};
    }

    let version = await getCurrentVersion();
    if(version.error) return version;

    let allChampionsData = await getAllChampionsData(version);
    if(allChampionsData.error) return allChampionsData;

    let accountData = {};
    if(!account_id) {
        accountData = await getAccountBySummonerName(summonerName, realm);
        if(accountData.error) return accountData;
    } else {
        accountData = await getAccountByAccountId(account_id, realm);
        if(accountData.error) return accountData;
    }


    let summoner_id = accountData.id;
    let championMasteryData = await getChampionMasteries(summoner_id, realm);
    if(championMasteryData.error) return championMasteryData;

    for(let i = 0; i < championMasteryData.length; i++) {
        let currentChampId = championMasteryData[i].championId;
        championMasteryData[i].champion = linkChampion(allChampionsData, currentChampId);
    }

    let totalMasteryData = await getTotalMasteryLevel(summoner_id, realm);
    if(totalMasteryData.error) return totalMasteryData;

    console.log(totalMasteryData);

    profileObj.version = version;
    profileObj.accountData = accountData;
    profileObj.championMasteries = championMasteryData;
    profileObj.totalMasteryLevel = totalMasteryData;


    return profileObj;
}

//******************************************//
//************Help Functions****************//
//******************************************//

async function getAccountBySummonerName(summonerName, realm) {
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

async function getAccountByAccountId(account_id, realm) {
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

async function getMatchList(account_id, startIndex, endIndex, realm) {
    console.log("Getting MatchList for account id: " + account_id + " Matches: " + startIndex + "-" + endIndex);
    let matchListResponse = await requestPromise(`https://${realm}.api.riotgames.com/lol/match/v4/matchlists/by-account/${account_id}?endIndex=${endIndex}&beginIndex=${startIndex}&api_key=${apiKey}`);
    if(!matchListResponse.aborted && matchListResponse.statusCode == 200) {
        let matchListData = JSON.parse(matchListResponse.body);
        return matchListData;
    } else {
        return {error: true, requestObj: matchListResponse};
    }
}

////////////////////////////////////////////////

async function getCurrentVersion() {
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

async function getAllChampionsData(version) {
    console.log("Getting static-AllchampionData by version: " + version);
    let champResponse = await requestPromise(`http://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion.json`);
    if(!champResponse.aborted && champResponse.statusCode == 200) {
        let champData = JSON.parse(champResponse.body);
        return champData;
    } else {
        return {error: true, requestObj: champResponse};
    }
}

async function getSpecificChampionData(version, championName) {
    console.log("Getting specific ChampionData for: " + championName);
    let champResponse = await requestPromise(`http://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion/${championName}.json`)
    if(!champResponse.aborted && champResponse.statusCode == 200) {
        let champData = JSON.parse(champResponse.body);
        return champData;
    } else {
        return {error: true, requestObj: champResponse};
    }
}

async function getSummonerspellData(version) {
    console.log("Getting static-SummonerSpells by version: " + version);
    let summonerResponse = await requestPromise(`http://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/summoner.json`);
    if(!summonerResponse.aborted && summonerResponse.statusCode == 200) {
        let summonerData = JSON.parse(summonerResponse.body);
        return summonerData;
    } else {
        return {error: true, requestObj: summonerResponse};
    }
}

async function getItemData(version) {
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

async function getMatchData(match_id, realm) {
    console.log("Getting matchData for matchId: " + match_id);
    let matchResponse = await requestPromise(`https://${realm}.api.riotgames.com/lol/match/v4/matches/${match_id}?api_key=${apiKey}`);
    if(!matchResponse.aborted && matchResponse.statusCode == 200) {
        let matchData = JSON.parse(matchResponse.body);
        return matchData;
    } else {
        return {error: true, requestObj: matchResponse};
    }
}

async function getTimelineData(match_id, realm) {
    console.log("Getting timelineData for matchId: " + match_id);
    let timelineResponse = await requestPromise(`https://${realm}.api.riotgames.com/lol/match/v4/timelines/by-match/${match_id}?api_key=${apiKey}`);
    if(!timelineResponse.aborted && timelineResponse.statusCode == 200) {
        let timelineData = JSON.parse(timelineResponse.body);
        return timelineData;
    } else {
        return {error: true, requestObj: timelineResponse};
    }
}

async function getChampionMasteries(summoner_id, realm) {
    console.log("Getting champion masteries by summonerId: " + summoner_id);
    let championMasteryResponse = await requestPromise(`https://${realm}.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-summoner/${summoner_id}?api_key=${apiKey}`);
    if(!championMasteryResponse.aborted && championMasteryResponse.statusCode == 200) {
        let championMasteryData = JSON.parse(championMasteryResponse.body);
        return championMasteryData;
    } else {
        return {error: true, requestObj: championMasteryResponse};
    }
}

async function getTotalMasteryLevel(summoner_id, realm) {
    console.log("Getting total mastery Level by summonerId: " + summoner_id);
    let totalMasteryLevelResponse = await requestPromise(`https://${realm}.api.riotgames.com/lol/champion-mastery/v4/scores/by-summoner/${summoner_id}?api_key=${apiKey}`);
    if(!totalMasteryLevelResponse.aborted && totalMasteryLevelResponse.statusCode == 200) {
        let totalMasteryData = JSON.parse(totalMasteryLevelResponse.body);
        return totalMasteryData;
    } else {
        return {error: true, requestObj: totalMasteryLevelResponse};
    }
}

//********************************************//
//************Module Functions****************//
//********************************************//

let linkChampion = function(allChampionsData, champion_id) {
    console.log("linking champion data with championID: " + champion_id);
    let currentChampObj = {};
    //get a list of champions to search for.
    let champNameList = Object.keys(allChampionsData.data);
    champNameList.forEach(function(champ) {
        if(allChampionsData.data[champ].key == champion_id) {
            currentChampObj = allChampionsData.data[champ];
            // console.log(currentChampObj);
        }
    });
    return currentChampObj;
}

let linkItems = function(itemIds, itemData) {
    let items = {};
    let itemNameList = Object.keys(itemData.data);
    let currentItemZeroId  = itemIds[0];
    let currentItemOneId   = itemIds[1];
    let currentItemTwoId   = itemIds[2];
    let currentItemThreeId = itemIds[3];
    let currentItemFourId  = itemIds[4];
    let currentItemFiveId  = itemIds[5];

    itemNameList.forEach(function(item) {
        if(item == currentItemZeroId) {
            items.zero = itemData.data[item];
        }
        if(item == currentItemOneId) {
            items.one = itemData.data[item];
        }
        if(item == currentItemTwoId) {
            items.two = itemData.data[item];
        }
        if(item == currentItemThreeId) {
            items.three = itemData.data[item];
        }
        if(item == currentItemFourId) {
            items.four = itemData.data[item];
        }
        if(item == currentItemFiveId) {
            items.five = itemData.data[item];
        }
    });
    return items;
}

let linkSummonerSpells = function(spellIds, summonerspellData) {
    console.log("Linking static summonerSpelldata with summonerSpellIds: " + spellIds);
    let summonerSpells = {};
    let sumspellNameList = Object.keys(summonerspellData.data);
    let currentSpellOneId = spellIds[0];
    let currentSpellTwoId = spellIds[1];

    sumspellNameList.forEach(function(spell) {
        if(summonerspellData.data[spell].key == currentSpellOneId) {
            summonerSpells.spellOne = summonerspellData.data[spell];
        }
        if(summonerspellData.data[spell].key == currentSpellTwoId) {
            summonerSpells.spellTwo = summonerspellData.data[spell];
        }
    });
    return summonerSpells;
}

let filterMatchInformationByParticipantId = function(timelineData, participantId) {
    console.log("Filtering timelineData to information in relation with participantId: " + participantId);
    let participantFrameIdList = Object.keys(timelineData.frames[0].participantFrames);

    let matchTimelineData = {}
    let participantFrameData = [];
    let eventSummarise = [];
    timelineData.frames.forEach(function(frame) {
        let eventFrameData = [];
        let participantFrameObj = {};
        participantFrameIdList.forEach(function(id) {
            if(typeof frame.participantFrames[id] !== "undefined") {
                if(frame.participantFrames[id].participantId == participantId) {
                    participantFrameObj.id = id;
                    participantFrameObj = frame.participantFrames[id];
                }
            }
        });
        frame.events.forEach(function(event) {
                if(event.participantId == participantId) {
                    eventFrameData.push(event);
                    eventSummarise.push(event);
                }
        });
        participantFrameObj.events = eventFrameData;
        participantFrameObj.timestamp = frame.timestamp;
        participantFrameData.push(participantFrameObj);
    });
    matchTimelineData.frames = participantFrameData;
    matchTimelineData.frameInterval = timelineData.frameInterval;
    matchTimelineData.allEvents = eventSummarise;

    let skillOrder = [];
    matchTimelineData.allEvents.forEach(function(event) {
        if (event.type === "SKILL_LEVEL_UP") {
            skillOrder.push(event);
        }
    });
    matchTimelineData.skillOrder = skillOrder;

    return matchTimelineData;
}

let filterMatchResult = function(data, account_id) {
    console.log("Filtering matchData so it shows information in relation to accountID: " + account_id);
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
                    matchObj.spells = {
                        spellOneId: p.spell1Id,
                        spellTwoId: p.spell2Id
                    };
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

function checkRealm(currentRealm, realmList) {
    let found = false;
    realmList.forEach(function(realm) {
        if(currentRealm === realm) {
            found = true;
        }
    });
    return found;
}

exports.getMatchHistory = getMatchHistory;
exports.getMatchSummary = getMatchSummary;
exports.getAccountsCrossRealms = getAccountsCrossRealms;
exports.getProfile = getProfile;
