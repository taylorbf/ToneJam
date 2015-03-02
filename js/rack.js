var colindex = 0;
var rackindex = 0;
var items = new Array();
var media = new Array();
var units = new Array();

function addRack(type,parent) {
	var unit = new Tone[type]()
	rack(unit,type,type,parent)
	unit.toMaster();
}

var rack = function (unit,unittype,unittitle,parent) {

	var rackid = "rack"+rackindex
	rackindex++
	var parts = Parts[unittype]

	var container = document.createElement("div")
	container.setAttribute("class", "rackunit")
	container.id = rackid
	parent.appendChild(container)

	var title = document.createElement("div")
	title.setAttribute("class", "racktitle")
	title.innerHTML = unittitle ? unittitle : unittype
	container.appendChild(title)


	for (var i=0;i<parts.length;i++) {

		var col = document.createElement("div")
		col.setAttribute("class", "rackcol")
		col.id = "col"+colindex
		colindex++
		container.appendChild(col)

		var widget = nx.add(parts[i].type,{
			parent: col.id,
			w: parts[i].size ? parts[i].size.w : false,
			h: parts[i].size ? parts[i].size.h : false
		});
		widget.unit = unit

		console.log(parts[i].type)
		if (parts[i].type=="select") {
			widget.choices = media
			widget.init();
		} 

		var action = parts[i].action
		action = action.bind(widget)
		widget.on('*', action)
		if (parts[i].initial) {
			console.log(widget.canvasID)
			widget.set(parts[i].initial)
		}

		var label = document.createElement("div")
		label.setAttribute("class", "racklabel")
		label.innerHTML = parts[i].label
		col.appendChild(label)

	}

	items.push(widget);

	units.push(widget.unit);

	for (var i=0;i<units.length;i++) {
		units[i].disconnect()
		if (i<units.length-1) {
			console.log(i)
			units[i].connect(units[i+1])
		} else {
			console.log(i + " master")
			units[i].toMaster()
		}
	}

	if (unittype=="Player") {
		unit.load("audio/"+media[0], function() { })
	}

}



var Parts = {
	"Player": [
		{
			label: "on/off",
			type: "toggle",
			action: function(data) {
				if (data.value) {
					this.unit.start();
				} else {
					console.log(this.unit)
					this.unit.stop();
				}
			}
		},{
			label: "vol",
			type: "dial",
			action: function(data) {
				this.unit.volume.value = nx.scale(data.value,0,1,-96,5)
			},
			initial: {
				"value": 0.95
			}
		},{
			label: "loop",
			type: "toggle",
			action: function(data) {
				this.unit.loop = data.value ? true : false;
			}
		},{
			label: "loop points",
			type: "range",
			action: function(data) {
				this.unit.setLoopPoints(data.start*this.unit.buffer.duration,data.stop*this.unit.buffer.duration)
			}
		},{
			label: "sound",
			type: "select",
			action: function(data) {
			//	console.log(data)
				this.unit.load("audio/"+data.text, function() { })
			},
			size: {
				w: 90,
				h: 30
			}
		},{
			label: "pitch",
			type: "keyboard",
			action: function(data) {
				if (data.on) {
				//	console.log(data.note)
				//	console.log(Math.pow(2,(data.note-60)/12))
					this.unit.playbackRate = Math.pow(2,(data.note-60)/12);
				}
			},
			size: {
				w: 400,
				h: 70
			}
		}
	],
	"PingPongDelay": [
		{
			label: "feedback / delay",
			type: "position",
			action: function(data) {
				this.unit.delayTime.value = data.x*2,10
				this.unit.feedback.value = data.y*0.99
			},
			size: {
				w: 150,
				h: 50
			}
		}
	],
	"Panner": [
		{
			label: "pan",
			type: "slider",
			action: function(data) {
			//	console.log(data.beat)
				this.unit.pan.value = data.value*2-1;
			//	console.log(this.unit.pan.value)
			},
			size: {
				w: 150,
				h: 25
			}
		}
	]
}