var request = require("./requests");
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
        accountData = await request.getAccountBySummonerName(summonerName, realm);
        if(accountData.error) return accountData;
        account_id = accountData.accountId;
    } else {
        //get accountinformation by accountId
        accountData = await request.getAccountByAccountId(account_id, realm);
        if(accountData.error) return accountData;
    }


    //Get matchList by accountId
    let matchListData = await request.getMatchList(account_id, startIndex, endIndex, realm);
    if(matchListData.error) return matchListData;
    let amountOfMatches = matchListData.endIndex - matchListData.startIndex;
    //Get current version.
    let version = await request.getCurrentVersion();
    if(version.error) return version;

    //get champ info
    let allChampionsData = await request.getAllChampionsData(version);
    if(allChampionsData.error) return allChampionsData;

    let summonerspellData = await request.getSummonerspellData(version);
    if(summonerspellData.error) return summonerspellData;

    //console.log(sumspellNameList);
    let itemData = await request.getItemData(version);
    if(itemData.error) return itemData;
    // console.log(itemNameList);

    let matchResults = [];
    console.log("Getting matchData for: " + amountOfMatches + " matches.");
    for(let i = 0; i < amountOfMatches; i++) {
        console.log("start: " + i);
        let currentMatchId = matchListData.matches[i].gameId;
        let currentChampId = matchListData.matches[i].champion;

        //get matchdata
        let matchData = await request.getMatchData(currentMatchId, realm);
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
            let timelineData = await request.getTimelineData(currentMatchId, realm);
            if(timelineData.error) return timelineData;

            //filter data and events by participant id.
            let currentParticipantId = matchResult.participantId;
            matchTimelineData = filterMatchInformationByParticipantId(timelineData, currentParticipantId);

            let currentChampionName = currentChampObj.id;
            console.log(currentChampionName);
            let championResponse = await request.getSpecificChampionData(version, currentChampionName);
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

    let version = await request.getCurrentVersion();
    if(version.error) return version;

    let allChampionsData = await request.getAllChampionsData(version);
    if(allChampionsData.error) return allChampionsData;

    let summonerspellData = await request.getSummonerspellData(version);
    if(summonerspellData.error) return summonerspellData;

    let itemData = await request.getItemData(version);
    if(itemData.error) return itemData;


    let matchData = await request.getMatchData(match_id, realm);
    if(matchData.error) return matchData;

    let timelineData = await request.getTimelineData(match_id, realm);
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
        let accountData = await request.getAccountBySummonerName(summonerName, realmList[i]);
        if(!accountData.error) {
            accounts.push(accountData);
        }
    }
    if(accounts.length < 1) {
        return {error: true};
    }

    let version = await request.getCurrentVersion();
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

    let version = await request.getCurrentVersion();
    if(version.error) return version;

    let allChampionsData = await request.getAllChampionsData(version);
    if(allChampionsData.error) return allChampionsData;

    let accountData = {};
    if(!account_id) {
        accountData = await request.getAccountBySummonerName(summonerName, realm);
        if(accountData.error) return accountData;
    } else {
        accountData = await request.getAccountByAccountId(account_id, realm);
        if(accountData.error) return accountData;
    }


    let summoner_id = accountData.id;
    let championMasteryData = await request.getChampionMasteries(summoner_id, realm);
    if(championMasteryData.error) return championMasteryData;

    for(let i = 0; i < championMasteryData.length; i++) {
        let currentChampId = championMasteryData[i].championId;
        championMasteryData[i].champion = linkChampion(allChampionsData, currentChampId);
    }

    let totalMasteryData = await request.getTotalMasteryLevel(summoner_id, realm);
    if(totalMasteryData.error) return totalMasteryData;

    console.log(totalMasteryData);

    profileObj.version = version;
    profileObj.accountData = accountData;
    profileObj.championMasteries = championMasteryData;
    profileObj.totalMasteryLevel = totalMasteryData;


    return profileObj;
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
