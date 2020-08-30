let jsonMatchData = require("./matchData.json");
let mongoose = require("mongoose");
mongoose.connect("mongodb://192.168.2.231:27017/matchDataV3", {useNewUrlParser: true});
let matchSchema = new mongoose.Schema({}, {strict: false});
let Match = mongoose.model("Match", matchSchema);
let entry = new Match(jsonMatchData.matches[1]);
// Match.findOne({gameId: jsonMatchData.matches[1].gameId}, function(err, docs) {
//     if(!docs) {
//         entry.save((err) => {
//             if(err) {
//                 console.log("Error: " + err);
//             } else {
//                 console.log("Success!");
//                 mongoose.disconnect();
//             }
//         });
//     } else {
//         console.log("Exists");
//         mongoose.disconnect();
//     }
// });

let main = async function () {

    let result = await Match.countDocuments();
    console.log(result);
    mongoose.disconnect();
}();
