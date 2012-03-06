(function() {
	var debugEnabled = true;
	var serverAddress = "10.149.0.251";
	var serverPort = 3000;
	var maxCpuPoints = 40;
	var socket;
	
	var cpuDataSets = {
		"usr": {
			label: "Usr",
			color: 1,
			data: []
		},
		"sys": {
			label: "Sys",
			color: 2,
			data: []
		},
		"idl": {
			label: "Idle",
			color: 3,
			data: []
		}
	}
	var memData = {
		label: "Memory",
		data: [],
		lines: { 
			fill:true,
			fillColor: "rgba(255, 0, 0, 0.7)"
		}
	}
	
	/* 
		data contains: usr sys idle 
	*/
	function parseCpuData(data, time) {
		var trimmed = data.trim();
		var vals = trimmed.split('  ');
		
		cpuDataSets.usr.data.push([time, parseInt(vals[0])]);
		cpuDataSets.sys.data.push([time, parseInt(vals[1])]);
		cpuDataSets.idl.data.push([time, parseInt(vals[2])]);
		
		if (cpuDataSets.usr.data.length > maxCpuPoints) cpuDataSets.usr.data.shift();
		if (cpuDataSets.sys.data.length > maxCpuPoints) cpuDataSets.sys.data.shift();
		if (cpuDataSets.idl.data.length > maxCpuPoints) cpuDataSets.idl.data.shift();
		
		var chartData = [cpuDataSets.usr, cpuDataSets.sys, cpuDataSets.idl];
		//console.log(cpuDataSets.usr);
		$.plot($("#cpuchart"), chartData, { xaxis: {mode: "time"}, yaxis: { max: 100 } });
	}
	
	/* 
		data contains: used buff cache free 
	*/
	var totalMemory = 0;
	function parseMemoryData(data, time) {
		var trimmed = data.trim();
		var vals = trimmed.split(' ');
		if (totalMemory <= 0) {
			// should only need to calculate this once
			var total = 0;
			for (var i=0; i< vals.length; i++) {
				if (vals[i].length > 0) {
					total += parseFloat(vals[i]);
				}
			}
			totalMemory = Math.ceil(total);
		}
		var free = parseInt(vals[vals.length-1]);
		var memoryUsed = Math.round(((totalMemory-free) / totalMemory) * 100);
		if (memoryUsed > 100) memoryUsed = 100;
		
		memData.data.push([time, memoryUsed]);
		if (memData.data.length > 40) memData.data.shift();
		var chartData = [memData];
		$.plot($("#memchart"), chartData, { xaxis: {mode: "time"}, yaxis: { max: 100 } });
		
	}
	
	function dstatHandler(data) {
		//console.log("update flot with " + data);
		var time = new Date().getTime();
		var parts = data.split("|");
		
		parseCpuData(parts[0], time);
		parseMemoryData(parts[1], time);
	}
		
	function debug(msg) {
		if (debugEnabled) {
			try { console.log(msg) }
			catch (err) {}
		}
	}
	
	function initSocket() {
		socket = new io.connect(serverAddress, {port: serverPort});
		socket.on("dstat", function(data){
			/* data is string of values seperated by spaces 
				cpu usage. usr, sys, idle */
			//debug("Client socket: " + data);
			dstatHandler(data);
		});
	}
	function init() {
		console.log("Server Address " + serverAddress);
		initSocket();
	}
		
	$(document).ready(function() {
		init();
	});
		
})()
