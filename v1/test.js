var util = require("util");
var request = require("request");
var requestPromise = util.promisify(request);
var apiKey = "RGAPI-056a6e08-181f-42ab-815e-1b2f770a3ee5";



async function getChamp(champion_id) {
    var response = await requestPromise(`http://ddragon.leagueoflegends.com/cdn/6.24.1/data/en_US/champion.json`);
    let data = JSON.parse(response.body);
    let list = Object.keys(data.data);
    list.forEach(function(champ) {
        if(data.data[champ].key === champion_id) {
            console.log(data.data[champ]);
        }
    });
}


//http://ddragon.leagueoflegends.com/cdn/6.24.1/img/champion/Jinx.png
main();
