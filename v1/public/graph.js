window.onload = function () {
    var data;
    var request = new XMLHttpRequest();
    request.open('GET', `http://192.168.2.231:3000/summoner/${realm}/${summonerName}/matchhistory/json`, false);
    request.onload = function() {
        if (request.status >= 200 && request.status < 400) {
            data = JSON.parse(this.response);
        } else {
            console.log("error");
        }
    }
    request.send();

    let frameData = getFrameData(data);
    var goldChart = function(matches) {
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
        	data: matches
        });
        chart.render();
    }
    var minionChart = function(matches) {
        var chart = new CanvasJS.Chart("minionChartContainer", {
        	animationEnabled: true,
        	title:{
        		text: "Minion Data"
        	},
        	axisX: {
        		// valueFormatString: "DD MMM,YY"
                suffix: " min"
        	},
        	axisY: {
        		title: "MinionsKilled",
                suffix: " cs",
        		includeZero: false
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
        	data: matches
        });
        chart.render();
    }

    var experienceChart = function(matches) {
        var chart = new CanvasJS.Chart("experienceChartContainer", {
        	animationEnabled: true,
        	title:{
        		text: "Experience"
        	},
        	axisX: {
        		// valueFormatString: "DD MMM,YY"
                suffix: " min"
        	},
        	axisY: {
        		title: "Experience",
                suffix: " xp",
        		includeZero: false
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
        	data: matches
        });
        chart.render();
    }
    goldChart(frameData.goldData);
    minionChart(frameData.minionData);
    experienceChart(frameData.experienceData);
}

function getFrameData(data) {
    let matches = {};
    let goldData = [];
    let minionData = [];
    let experienceData = [];
    data.matchResults.forEach(function(match) {
        let totalGoldDataPoints = [];
        let minionDataPoints = [];
        let experienceDataPoints = [];
        match.matchFrameData.frames.forEach(function(frame) {
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
        });
        let name = `matchIndex: ${match.index}`;
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
    });
    matches.goldData = goldData;
    matches.minionData = minionData;
    matches.experienceData = experienceData;
    return matches;
}
