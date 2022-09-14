function releaseCanvas(canvas) {
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    ctx && ctx.clearRect(0, 0, 1, 1);
}
window.onload = function () {
    fetch('http://localhost:3002/login', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
    }).then(response => {
        fetch('http://localhost:3002/data', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
        })
            .then(response => response.json())
            .then(res => {
    var fetchData = res["data"][0]["trackLines"];
    var canvas = document.getElementById('mainCanvas');

canvas.width = window.innerWidth-20;
canvas.height = window.innerHeight;

var ctx = canvas.getContext('2d');

var railColor = 'black';
var carLength = 15;
var carWidth = 8;
var carColor = 'brown';
var locomotiveColor = 'red';
var carDistance = 3;
var leftCycle = 300;
var rightCycle = 300;
var textColor = 'black';
var showTrainId = true;
var animationSpeed = 2;
var trafficLights = [[],[]];
var allLights = [];
var ratio = canvas.width/40000;

var stations1 = fetchData[0]["stations"];
var stations2 = fetchData[1]["stations"];

var len1 = stations1.length;
var len2 = stations2.length;
var len = len1+len2;

class trafficLight {
	constructor(x1,y1,color,id) {
		this.x1 = x1;
		this.y1 = y1;
		this.color = color;
		this.id = id;
	}
	drawL() {
		ctx.fillStyle = "gray";
		ctx.fillRect(this.x1,this.y1-20,30,15);
		this.drawLight("l");
		trafficLights[0].push(this);
		allLights.push(this);
	}
	drawR() {
		ctx.fillStyle = "gray";
		ctx.fillRect(this.x1+stationLen,this.y1-20,30,15);
		this.drawLight("r");
		trafficLights[1].push(this);
		allLights.push(this);
	}
	drawLight(rl){
		var a;
		
		a = this.color==="red"?7: this.color==="yellow"?15: this.color==="lightgreen"?22: "black";
		ctx.beginPath();
		
		if (rl==="l") {
			ctx.arc(this.x1+a,this.y1-13,5,0,Math.PI*2,false);
		}else if(rl==="r") {
			ctx.arc(this.x1+a+stationLen,this.y1-13,5,0,Math.PI*2,false);
		}

		ctx.fillStyle = this.color;
		ctx.fill();
		ctx.closePath();
	}
	changeColor(col) {
		this.color = col;
	}
	drawLR(){
		this.drawL();
		this.drawR();
	}
}

var RailLine = function (x1, y1, x2, y2, id) {
	this.x1 = Math.ceil(x1);
	this.y1 = Math.ceil(y1);
	this.x2 = Math.ceil(x2);
	this.y2 = Math.ceil(y2);
	this.id = id;
};

RailLine.prototype.draw = function () {
	ctx.save();
	ctx.strokeStyle = railColor;
	ctx.beginPath();
	ctx.moveTo(this.x1, this.y1);
	ctx.lineTo(this.x2, this.y2);
	ctx.stroke();
	ctx.restore();
};

RailLine.prototype.drawTrafficLight = function (change) {
	var tl = null;
	tl = new trafficLight(this.x1, this.y1-25, "red");
	if(change)
		tl.changeColor(change);

	tl.drawLR();
}

RailLine.prototype.drawTrafficLightL = function (change) {
	var tl = null;
	tl = new trafficLight(this.x1, this.y1-25, "red");
	if(change)
		tl.changeColor(change);

	tl.drawL();
}

RailLine.prototype.drawTrafficLightR = function (change) {
	var tl = null;
	tl = new trafficLight(this.x1, this.y1-25, "red");
	if(change)
		tl.changeColor(change);

	tl.drawR();
}

var Rail = function (id, railLines) {
	this.id = id;
	this.railLines = railLines;
	this.reservation = [];
};

Rail.prototype.xToy = function (x) {
	for (var i = 0; i < this.railLines.length; i++) {
		if (this.railLines[i].x1 <= x && x <= this.railLines[i].x2) {
			var a = (this.railLines[i].y2 - this.railLines[i].y1) / (this.railLines[i].x2 - this.railLines[i].x1);
			return this.railLines[i].y1 + a * (x - this.railLines[i].x1) - carWidth / 2;
		}
	}
	return this.railLines[0].y2 - carWidth / 2;
};

Rail.prototype.toAngle = function (x) {
	for (var i = 0; i < this.railLines.length; i++) {
		if (this.railLines[i].x1 <= x && x <= this.railLines[i].x2) {
			var dy = (this.railLines[i].y2 - this.railLines[i].y1);
			var dx = (this.railLines[i].x2 - this.railLines[i].x1);
			return Math.atan2(dy, dx);
		}
	}
	return 0;
};
Rail.prototype.left = function () {
	if (this.railLines && this.railLines[0]) {
		return this.railLines[0].x1;
	}
};
Rail.prototype.right = function () {
	if (this.railLines && this.railLines[this.railLines.length - 1]) {
		return this.railLines[this.railLines.length - 1].x2;
	}
};
Rail.prototype.middle = function () {
	return (this.left() + this.right()) / 2;
};
Rail.prototype.draw = function () {
	for (var i = 0; i < this.railLines.length; i++) {
		this.railLines[i].draw();
	}
};

var Car = function (color) {
	this.color = color;
};

Car.prototype.draw = function (id, x, rail) {
	var y = rail.xToy(x);
	var angle = rail.toAngle(x);
	ctx.save();
	ctx.translate(x, y);
	ctx.rotate(angle);
	if (this.color === locomotiveColor && showTrainId) {
		ctx.fillStyle = textColor;
		ctx.font = '12px arial';
		ctx.textBaseline = 'bottom';
		ctx.fillText(id, 0, 0);
	}
	ctx.fillStyle = this.color;
	ctx.beginPath();
	ctx.fillRect(-carLength / 2, 0, carLength, carWidth);
	ctx.fill();
	ctx.restore();
};

var Train = function (id, rail, speed, numCars, carColor) {
	this.id = id;
	this.rail = rail;
	this.previousRail = rail;
	this.speed = speed;
	this.state = 'moving';
	this.simState = '';
	this.reachedState = '';
	this.destinationX = null;

	var cars = [];
	for (var i = 0; i < numCars; i++) {
		this.x = speed > 0 ? rail.railLines[0].x1 : rail.railLines[0].x2;
		cars.push(new Car(i === 0 ? locomotiveColor : carColor));
	}
	this.cars = cars;
};
Train.prototype.move = function () {
	if (this.state == 'moving') {
		var newX = this.x + (this.speed) * animationSpeed;
		if (this.speed > 0 && newX > this.destinationX) {
			this.state = this.reachedState;
		}
		if (this.speed < 0 && newX < this.destinationX) {
			this.state = this.reachedState;
		}

		if (this.state == 'moving') {
			this.x = newX;
		}
	}
};
Train.prototype.draw = function () {
	for (var i = 0; i < this.cars.length; i++) {
		var x = this.x + (this.speed > 0 ? -1 : 1) * (i * (carLength + carDistance));
		var rail = this.rail;
		if (this.speed > 0 && x < this.rail.left()) {
			rail = this.previousRail;
		}
		if (this.speed < 0 && x >= this.rail.right()) {
			rail = this.previousRail;
		}

		this.cars[i].draw(this.id, x, rail);
	}
	
};
Train.prototype.trainLength = function () {
	return this.cars.length * (carLength + carDistance);
};

var RailSystem = function () {

	this.rails = [];
	
	for (let i = 0; i < stations1.length; i++) {
		if(i!==stations1.length-1) {
			var rail = new Rail(i, [
			new RailLine(stations1[i]["position"]*ratio, 300, stations1[i+1]["position"]*ratio, 300, i)
		]);
		}else {
			var rail = new Rail(i, [new RailLine(stations1[i]["position"]*ratio, 300, canvas.width*10, 300, i)] )
		}
		
		this.rails.push(rail);
	};
	
	for (let i = 0; i < stations2.length; i++) {
		if(i!==stations2.length-1) {
			var rail = new Rail(i+len1, [
			new RailLine(stations2[i]["position"]*ratio,300+4*stationLen, stations2[i+1]["position"]*ratio,300+4*stationLen,i+len1)
		]);
		}else {
			var rail = new Rail(i+len1, [new RailLine(stations2[i]["position"]*ratio,300+4*stationLen,canvas.width,300+4*stationLen,i+len1)] )
		}
		
		this.rails.push(rail);
	};
};

const stationLen = 50;

RailSystem.prototype.draw = function () {
	var allstations = stations1.concat(stations2);
	for (var i = 0; i < this.rails.length/2; i++) {
		this.rails[i].draw();	
		ctx.strokeStyle = "red";
		ctx.rect(this.rails[i].railLines[0].x1,this.rails[i].railLines[0].y1-stationLen/2, stationLen, stationLen);
		ctx.stroke();
		ctx.fillStyle = textColor;
		ctx.font = '20px arial';
		var text = allstations[i]["shortName"];
		ctx.fillText(text, this.rails[i].railLines[0].x1, this.rails[i].railLines[0].y1+stationLen);
	}

	for (var i = this.rails.length/2; i < this.rails.length; i++) {
		this.rails[i].draw();	
		ctx.strokeStyle = "red";
		ctx.rect(this.rails[i].railLines[0].x1,this.rails[i].railLines[0].y1-stationLen/2, stationLen, stationLen);
		ctx.stroke();
		ctx.fillStyle = textColor;
		ctx.font = '20px arial';
		var text = allstations[i]["shortName"];
		ctx.fillText(text, this.rails[i].railLines[0].x1, this.rails[i].railLines[0].y1+stationLen);
		text = allstations[i]["name"];
		ctx.font = '13px arial';
		ctx.fillText(text, this.rails[i].railLines[0].x1, this.rails[i].railLines[0].y1+stationLen*1.5);
	}
};

class Switch {
	constructor(railSys, railid){
		this.currentPos = 0;
		this.nexts = [];
		this.railSys = railSys;
		this.railid = railid;
		this.xpoint = railSys.rails[railid].right();
		this.ypoint = railSys.rails[railid].xToy(this.xpoint);
	}

	drawSwitch() {
		ctx.save();
		ctx.strokeStyle = "blue";
		ctx.lineWidth = 3;
		ctx.beginPath();
		ctx.moveTo(this.xpoint, this.ypoint+3);

		ctx.lineTo((this.railSys.rails[this.currentPos].railLines[0].x2 + this.xpoint)/2 ,(this.railSys.rails[this.currentPos].railLines[0].y2 + this.ypoint)/2);
		ctx.stroke();
		ctx.restore();
	}

	findNexts() {
		this.railSys.rails.forEach((rl)=>{ 
			if (rl.left()===this.railSys.rails[this.railid].right()) {
				this.nexts.push(rl);
			}
		});		
	}

	changeSwitchPos(id) {
		this.currentPos = id;
	}
}

var SimMaster = function () {
	this.railSystem = new RailSystem();
	this.lcnt = -1;
	this.rcnt = -1;
	this.trains = [];
	this.trainIds = 0;
	this.maxNo = Math.floor(canvas.width / 9 / (carLength + carDistance)) - 2;
};
SimMaster.prototype.drawControlTower = function (x, y) {
	ctx.save();
	var width = Math.floor(canvas.width / 19);
	var height = Math.floor(canvas.height / 4);
	ctx.translate(x - width / 2, y - height / 2);
	ctx.fillStyle = 'lightgray';
	ctx.beginPath();
	ctx.moveTo(0, 0);
	ctx.lineTo(0, height / 5);
	ctx.lineTo(width / 4, height * 2 / 5);
	ctx.lineTo(width / 2, height * 2 / 5);
	ctx.lineTo(width * 3 / 4, height / 5);
	ctx.lineTo(width * 3 / 4, 0);
	ctx.closePath();
	ctx.fill();
	ctx.fillRect(width / 4, (height * 2 / 5) - ctx.lineWidth , width / 4, (height * 3 / 5) + ctx.lineWidth);
	ctx.fillRect(width / 2, height * 3 / 5, width / 2, height * 2 / 5);
	ctx.fillStyle = 'gray';
	ctx.fillRect(0, 0, width * 3 / 4, 2);
	ctx.fillRect(width - width / 3, height - height / 10, width / 11, height / 11);
	ctx.fillStyle = '#ADDEFF';
	ctx.fillRect(width * 3 / 40, height / 25, width * 3 / 5, height * 4 / 25);
	ctx.restore();
};

SimMaster.prototype.draw = function () {
	var freeRailsL = [0, 1, 2, 3, 4, 10, 11, 12, 13];
    var freeRailsR = [5, 6, 7, 8, 9, 14, 15, 16, 17];
    var destinationX, numCars;
	if ((this.lcnt++ % leftCycle) === 0) {
		if (freeRailsL.length > 2) {
			numCars = 1 + Math.floor(Math.random() * this.maxNo);
			this.railSystem.rails[1].railLines[0].drawTrafficLightL("red");
			this.trains[this.trains.length++] = new Train(this.trainIds++, simMaster.railSystem.rails[0], 1, numCars, randomColor());
			this.trains[this.trains.length - 1].destinationX = simMaster.railSystem.rails[0].right();
			this.trains[this.trains.length - 1].simState = 'goingToRegroup';
			this.trains[this.trains.length - 1].reachedState = 'firstTurn';
		}
	}
	if ((this.rcnt++ % rightCycle) === 0) {
		if (freeRailsR.length > 2 ) {
			numCars = 1 + Math.floor(Math.random() * this.maxNo);
			this.railSystem.rails[len-1].railLines[0].drawTrafficLightR("red");
			this.trains[this.trains.length++] = new Train(this.trainIds++, simMaster.railSystem.rails[len-1], -1, numCars, randomColor());
			this.trains[this.trains.length - 1].destinationX = simMaster.railSystem.rails[len-1].left();

			this.trains[this.trains.length - 1].simState = 'goingToRegroup';
			this.trains[this.trains.length - 1].reachedState = 'firstTurn';
		}
	}

	this.railSystem.draw();

	this.railSystem.rails.forEach(element => {
		element.railLines[0].drawTrafficLight("lightgreen");
	});
	
	for (var i = 0; i < this.trains.length; i++) {
		this.trains[i].move();
		var railid = this.trains[i].rail.id;

		this.trains.forEach(tr => {
				if (this.trains[i].speed>0) {
						this.railSystem.rails[tr.rail.id].railLines[0].drawTrafficLightR("red");
				} else {
						this.railSystem.rails[tr.rail.id].railLines[0].drawTrafficLightL("red");
				}
			
		});

		if (this.trains[i].state === 'firstTurn') {
			railid = this.trains[i].rail.id;
			if (railid<len-1) {
				destinationX = (this.railSystem.rails[railid+1].left() + this.railSystem.rails[railid+1].right()) / 2;
			} 

			this.trains[i].state = 'moving';
			this.trains[i].destinationX = destinationX;
			this.trains[i].reachedState = 'waitingForMiddle';
			this.trains[i].previousRail = this.trains[i].rail;
			this.trains[i].rail = this.railSystem.rails[railid];
		}

		if (this.trains[i].state === 'waitingForMiddle') {
			railid = this.trains[i].rail.id;
				var currentRail = this.trains[i].rail;
				this.trains[i].previousRail = currentRail;
				destinationX = this.trains[i].speed > 0 ? currentRail.right() : currentRail.left();
				this.trains[i].state = 'moving';
				this.trains[i].destinationX = destinationX;
				this.trains[i].reachedState = 'goIntoMiddle';
		}

		if (this.trains[i].state === 'goIntoMiddle') {
			var middleRail = this.railSystem.rails[6];
			destinationX = this.trains[i].speed > 0 ? middleRail.right() : middleRail.left();
			this.trains[i].state = 'moving';
			this.trains[i].destinationX = destinationX;
			this.trains[i].reachedState = 'pickWayOut';
			this.trains[i].previousRail = this.trains[i].rail;
			this.trains[i].rail = middleRail;
		}

		if (this.trains[i].state === 'pickWayOut') {
			var freeRailPickSet = this.trains[i].speed > 0 ? [8] : [9];
			var wayOut = this.railSystem.rails[randomElement(freeRailPickSet)];
            
			if (wayOut) {
				destinationX = this.trains[i].speed > 0 ? wayOut.right() : wayOut.left();
				this.trains[i].state = 'moving';
				this.trains[i].destinationX = destinationX;
				this.trains[i].reachedState = 'goToExit';
				this.trains[i].previousRail = this.trains[i].rail;
				this.trains[i].rail = wayOut;
			}
		}
		if (this.trains[i].state === 'goToExit') {
			destinationX = this.trains[i].speed > 0 ? canvas.width + this.trains[i].trainLength() : - this.trains[i].trainLength();
			this.trains[i].state = 'moving';
			this.trains[i].destinationX = destinationX;
			this.trains[i].reachedState = 'exit';
			this.trains[i].previousRail = this.trains[i].rail;
			this.trains[i].rail = this.railSystem.rails[this.trains[i].speed > 0 ? len-1 : 0];
		}
		if (this.trains[i].state === 'exit') {
			this.trains.splice(i, 1);
			i = 0;
		} else {
			this.trains[i].draw();
		}
	}
};

var simMaster = new SimMaster();

window.onresize = function() {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	simMaster = new SimMaster();
};

window.requestAnimFrame = (function(){
	return window.requestAnimationFrame ||
	window.webkitRequestAnimationFrame ||
	window.mozRequestAnimationFrame ||
	function( callback ) {
		window.setTimeout(callback, 1000 / 60);
	};
})();

function randomColor () {
	return 'rgb(' + Math.floor((Math.random() * 150)) + ', ' + Math.floor((Math.random() * 255)) + ',' + Math.floor((Math.random() * 255)) + ')';
}

function randomElement(data) {
	return data[Math.floor(Math.random() * data.length)];
}

// var gui = new GUI();
// gui.add(window, 'animationSpeed').min(1).max(3).step(1).name('Speed');
// gui.add(window, 'showTrainId').name('Show Text');
// gui.add(window, 'leftCycle').min(100).max(1000).step(1).name('L New delay');
// gui.add(window, 'rightCycle').min(100).max(1000).step(1).name('R New delay');

(function animloop(){
	requestAnimFrame(animloop);
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	simMaster.draw();
})();
            })
    });
};
