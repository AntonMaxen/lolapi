var express = require("express");
var app = express();
var myApi = require("./apiTwo");
var jsonHistoryObj = {
    ru: {}, kr: {}, br1: {}, oc1: {}, jp1: {}, na1: {}, eun1: {}, euw1: {}, tr1: {}, la1: {}, la2: {}
};
var jsonMatchObj = {
    ru: {}, kr: {}, br1: {}, oc1: {}, jp1: {}, na1: {}, eun1: {}, euw1: {}, tr1: {}, la1: {}, la2: {}
};
var jsonProfileObj = {
    ru: {}, kr: {}, br1: {}, oc1: {}, jp1: {}, na1: {}, eun1: {}, euw1: {}, tr1: {}, la1: {}, la2: {}
};

let gamemode = {
    0: "Custom Game",
    76: "Rift URF",
    325: "Rift AR",
    400: "Normal(Draft Pick)",
    420: "Ranked Solo/Duo",
    430: "Normal(Blind Pick)",
    440: "Ranked Flex",
    450: "ARAM",
    460: "3v3 Blind Pick",
    470: "3v3 Ranked Flex",
    800: "3v3 Bot Hard",
    810: "3v3 Bot Easy",
    820: "3v3 Bot Normal",
    830: "5v5 Bot Easy",
    840: "5v5 Bot Normal",
    850: "5v5 Bot Hard",
    900: "AR URF"
};

app.set("view engine", "ejs");

app.use(express.static(__dirname + "/public"));

app.get("/", (req, res) => {
    res.render("search");
});

// Search Route
app.get("/search/:id", async (req, res) => {
    let summonerName = req.params.id.toLowerCase();
    res.render("accounts", {summonerName: summonerName});
});
// Search Api
app.get("/search/:id/json", async (req, res) => {
    let summonerName = req.params.id.toLowerCase();
    let accountInfo = await myApi.getAccountsCrossRealms(summonerName);
    if(!accountInfo.error) {
        res.send(accountInfo);
    } else {
        res.send(accountInfo);
    }
});

// Profile Route
app.get("/summoner/:realm/:id", async (req, res) => {
    let realm = req.params.realm.toLowerCase();
    let summonerName = req.params.id.toLowerCase();
    let accountId = req.query.accountid;
    res.render("profile", {realm: realm, summonerName: summonerName, accountId: accountId});
});

// Profile Api
app.get("/summoner/:realm/:id/json", async (req, res) => {
    let realm = req.params.realm.toLowerCase();
    let summonerName = req.params.id.toLowerCase();
    let accountId = req.query.accountid;

    let profileInfo = await myApi.getProfile(summonerName, realm, accountId);
    if(!profileInfo.error) {
        jsonProfileObj[realm][summonerName] = profileInfo;
        res.send(profileInfo);
    } else {
        res.send(profileInfo);
    }
});

// Match History Route
app.get("/summoner/:realm/:id/matchhistory", async (req, res) => {
    let realm = req.params.realm.toLowerCase();
    let summonerName = req.params.id.toLowerCase();
    var account_id = req.query.accountid ? req.query.accountid : false;

    var startIndex = req.query.startindex ? req.query.startindex : 0;
    var endIndex = req.query.endindex ? req.query.endindex : 10;
    res.render("show", {
        realm: realm,
        summonerName: summonerName,
        startIndex: startIndex,
        endIndex: endIndex,
        accountId: account_id
    });


});

// Match History Api
app.get("/summoner/:realm/:id/matchhistory/json", async (req, res) => {
    let realm = req.params.realm.toLowerCase();
    let summonerName = req.params.id.toLowerCase();

    var startIndex = req.query.startindex ? req.query.startindex : 0;
    var endIndex = req.query.endindex ? req.query.endindex : 10;
    var account_id = req.query.accountid ? req.query.accountid : false;
        account_id = account_id == "false" ? false : account_id;

    let matchInfo = await myApi.getMatchHistory(summonerName, startIndex, endIndex, realm, account_id);

    if(!matchInfo.error) {
        jsonHistoryObj[realm][summonerName] = matchInfo;
        res.send(matchInfo);
        // res.send(matchInfo);
    } else {
        res.send(matchInfo);
    }

});

app.get("/match/:realm/:matchid", async (req, res) => {
    let realm = req.params.realm.toLowerCase();
    let matchId = req.params.matchid;
    let summonerName = req.query.summonername ? req.query.summonername.toLowerCase() : "";

    let matchInfo = await myApi.getMatchSummary(matchId, realm);
    if(!matchInfo.error) {
        jsonMatchObj[realm][matchId] = matchInfo;
        res.render("match", {matchInfo: matchInfo, summonerName: summonerName, matchId: matchId, realm: realm, gamemode: gamemode});
        // res.send(matchInfo);
    } else {
        res.send(matchInfo);
    }
});

app.get("/match/:realm/:matchid/json", (req, res) => {
    let realm = req.params.realm.toLowerCase();
    let matchId = req.params.matchid
    res.send(jsonMatchObj[realm][matchId]);
});

app.get("/alljson", (req, res) => {
    res.send(jsonHistoryObj);
});

app.get("/allmatchjson", (req, res) => {
    res.send(jsonMatchObj);
});

app.get("/allprofilejson", (req, res) => {
    res.send(jsonProfileObj);
});

app.get("/summoner/:realm/:id/matchhistory/graphs", (req, res) => {
    let realm = req.params.realm.toLowerCase();
    let summonerName = req.params.id.toLowerCase();
    res.render("graph", {matchInfo: jsonHistoryObj[realm][summonerName]});
});

app.listen(3000, () => {
    console.log("listening on 3000");
});



//summonerName: data.participantIdentities[i].player.summonerName
//participantid: i+1
