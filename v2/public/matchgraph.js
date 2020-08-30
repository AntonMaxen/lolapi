window.onload = function () {
    var data;
    var request = new XMLHttpRequest();
    request.open('GET', `http://192.168.2.231:3000/match/${realm}/${matchId}/json`, false);
    request.onload = function() {
        if (request.status >= 200 && request.status < 400) {
            data = JSON.parse(this.response);
            console.log(data.gameId);
        } else {
            console.log("error");
        }
    }
    request.send();

    let frameData = getFrameData(data);

    var goldChart = function(goldData) {
        var chart = new CanvasJS.Chart("goldChartContainer", {
        	animationEnabled: true,
        	title:{
        		text: "Gold Data"
        	},
        	axisX: {
                suffix: " min",
        	},
        	axisY: {
        		title: "TotalGold",
        		includeZero: false,
                suffix: " g"
        		// suffix: " °C"
        	},
        	legend:{
        		cursor: "pointer",
        		fontSize: 16,
        		itemclick: function(e) {
                    if (typeof(e.dataSeries.visible) === "undefined" || e.dataSeries.visible) {
                		e.dataSeries.visible = false;
                	}
                	else{
                		e.dataSeries.visible = true;
                	}
                    chart.render();
                }
        	},
        	toolTip:{
        		shared: true
        	},
        	data: goldData
        });
        chart.render();
    }

    var minionChart = function(minionData) {
        var chart = new CanvasJS.Chart("minionChartContainer", {
        	animationEnabled: true,
        	title:{
        		text: "Minion Data"
        	},
        	axisX: {
                suffix: " min",
        	},
        	axisY: {
        		title: "MinionsKilled",
        		includeZero: false,
                suffix: " cs"
        		// suffix: " °C"
        	},
        	legend:{
        		cursor: "pointer",
        		fontSize: 16,
        		itemclick: function(e) {
                    if (typeof(e.dataSeries.visible) === "undefined" || e.dataSeries.visible) {
                		e.dataSeries.visible = false;
                	}
                	else{
                		e.dataSeries.visible = true;
                	}
                    chart.render();
                }
        	},
        	toolTip:{
        		shared: true
        	},
        	data: minionData
        });
        chart.render();
    }

    var experienceChart = function(experienceData) {
        var chart = new CanvasJS.Chart("experienceChartContainer", {
        	animationEnabled: true,
        	title:{
        		text: "Experience Data"
        	},
        	axisX: {
                suffix: " min",
        	},
        	axisY: {
        		title: "Total Experience",
        		includeZero: false,
                suffix: " xp"
        		// suffix: " °C"
        	},
        	legend:{
        		cursor: "pointer",
        		fontSize: 16,
        		itemclick: function(e) {
                    if (typeof(e.dataSeries.visible) === "undefined" || e.dataSeries.visible) {
                		e.dataSeries.visible = false;
                	}
                	else{
                		e.dataSeries.visible = true;
                	}
                    chart.render();
                }
        	},
        	toolTip:{
        		shared: true
        	},
        	data: experienceData
        });
        chart.render();
    }

    var jungleMinionChart = function(jungleMinionData) {
        var chart = new CanvasJS.Chart("jungleMinionChartContainer", {
        	animationEnabled: true,
        	title:{
        		text: "jungleMinion Data"
        	},
        	axisX: {
                suffix: " min",
        	},
        	axisY: {
        		title: "Jungleminions Killed",
        		includeZero: false,
                suffix: " cs"
        		// suffix: " °C"
        	},
        	legend:{
        		cursor: "pointer",
        		fontSize: 16,
        		itemclick: function(e) {
                    if (typeof(e.dataSeries.visible) === "undefined" || e.dataSeries.visible) {
                		e.dataSeries.visible = false;
                	}
                	else{
                		e.dataSeries.visible = true;
                	}
                    chart.render();
                }
        	},
        	toolTip:{
        		shared: true
        	},
        	data: jungleMinionData
        });
        chart.render();
    }

    var levelChart = function(levelData) {
        var chart = new CanvasJS.Chart("levelChartContainer", {
        	animationEnabled: true,
        	title:{
        		text: "Level Data"
        	},
        	axisX: {
                suffix: " min",
        	},
        	axisY: {
        		title: "Total Level",
        		includeZero: false,
                suffix: " lvl"
        		// suffix: " °C"
        	},
        	legend:{
        		cursor: "pointer",
        		fontSize: 16,
        		itemclick: function(e) {
                    if (typeof(e.dataSeries.visible) === "undefined" || e.dataSeries.visible) {
                		e.dataSeries.visible = false;
                	}
                	else{
                		e.dataSeries.visible = true;
                	}
                    chart.render();
                }
        	},
        	toolTip:{
        		shared: true
        	},
        	data: levelData
        });
        chart.render();
    }

    goldChart(frameData.goldData);
    minionChart(frameData.minionData);
    experienceChart(frameData.experienceData);
    jungleMinionChart(frameData.jungleMinionData);
    levelChart(frameData.levelData);
}

function getFrameData(data) {
    let frameData = {};
    let goldData = [];
    let minionData = [];
    let experienceData = [];
    let jungleMinionData = [];
    let levelData = [];
    data.teams.forEach(function(team) {
        team.participants.forEach(function(participant) {
            let totalGoldDataPoints = [];
            let minionDataPoints = [];
            let experienceDataPoints = [];
            let jungleMinionDataPoints = [];
            let levelDataPoints = [];
            participant.timelineData.frames.forEach(function(frame) {
                let timestamp = frame.timestamp / 60000;
                totalGoldDataPoints.push({
                    x: timestamp,
                    y: frame.totalGold
                });

                minionDataPoints.push({
                    x: timestamp,
                    y: frame.minionsKilled
                });

                experienceDataPoints.push({
                    x: timestamp,
                    y: frame.xp
                });

                jungleMinionDataPoints.push({
                    x: timestamp,
                    y: frame.jungleMinionsKilled
                });

                levelDataPoints.push({
                    x: timestamp,
                    y: frame.level
                });
            });
            let name = participant.player.summonerName;
            goldData.push({
                name: name,
                type: "spline",
                showInLegend: true,
                dataPoints: totalGoldDataPoints
            });

            minionData.push({
                name: name,
                type: "spline",
                showInLegend: true,
                dataPoints: minionDataPoints
            });

            experienceData.push({
                name: name,
                type: "spline",
                showInLegend: true,
                dataPoints: experienceDataPoints
            });

            jungleMinionData.push({
                name: name,
                type: "spline",
                showInLegend: true,
                dataPoints: jungleMinionDataPoints
            });

            levelData.push({
                name: name,
                type: "spline",
                showInLegend: true,
                dataPoints: levelDataPoints
            });
        });
    });
    frameData.goldData = goldData;
    frameData.minionData = minionData;
    frameData.experienceData = experienceData;
    frameData.jungleMinionData = jungleMinionData;
    frameData.levelData = levelData;
    return frameData;
}
