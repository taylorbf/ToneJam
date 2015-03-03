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
					this.unit.playbackRate = Math.pow(2,(data.note-60)/12);
				}
			},
			size: {
				w: 400,
				h: 70
			}
		}
	],
	"AMSynth": [
		{
			label: "volume",
			type: "dial",
			action: function(data) {
				this.unit.volume.rampTo(nx.scale(data.value,0,1,-96,5),1);
			},
			initial: {
				"value": 0.75
			}
		},{
			label: "mod (!)",
			type: "dial",
			action: function(data) {
				this.unit.harmonicity = data.value*100;
			}
		},{
			label: "glide",
			type: "dial",
			action: function(data) {
				this.unit.portamento = data.value;
			}
		},{
			label: "pitch",
			type: "keyboard",
			action: function(data) {
					if (data.on) {
						this.unit.setNote(Math.pow(2,(data.note-60)/12)*440)
						this.unit.triggerEnvelopeAttack(0, data.on)
					} else {
						this.unit.triggerEnvelopeRelease()
					}
				},
			size: {
				w: 400,
				h: 70
			}
		}
	],
	"FMSynth": [
	],
	"Instrument": [
	],
	"Microphone": [
	],
	"Noise": [
	],
	"PluckSynth": [
	],
	"PolySynth": [
	],
	"AutoPanner": [
		{
			label: "amount",
			type: "dial",
			action: function(data) {
				this.unit.amount = data.value;
			},
			initial: {
				value: 0.5
			}
		},
		{
			label: "freq",
			type: "dial",
			action: function(data) {
				this.unit.frequency = data.value*20;
			},
			initial: {
				value: 0
			}
		}
	],
	"BitCrusher": [
		{
			label: "bits",
			type: "dial",
			action: function(data) {
				this.unit.bits = ~~(data.value*24);
			},
			initial: {
				value: 1
			}
		},
		{
			label: "wet",
			type: "dial",
			action: function(data) {
				this.unit.wet.value = data.value;
			},
			initial: {
				value: 0
			}
		}
	],
	"Chebyshev": [
		{
			label: "order",
			type: "dial",
			action: function(data) {
				this.unit.order = ~~(data.value*50);
			},
			initial: {
				value: 1
			}
		}
	],
	"EQ": [
		{
			label: "low",
			type: "position",
			action: function(data) {
				this.unit.low.value = nx.invert(data.y)*-50+5
				this.unit.lowFrequency.value = data.x*1000
			},
			initial: {
				value: 1
			},
			size: {
				w: 100,
				h: 60
			}
		},
		{
			label: "m",
			type: "position",
			action: function(data) {
				this.unit.mid.value = nx.invert(data.y)*-50+5
			},
			initial: {
				value: 1
			},
			size: {
				w: 20,
				h: 60
			}
		},
		{
			label: "high",
			type: "position",
			action: function(data) {
				this.unit.high.value = nx.invert(data.y)*-50+5
				this.unit.highFrequency.value = data.x*2000+800
			},
			initial: {
				value: 1
			},
			size: {
				w: 100,
				h: 60
			}
		}
	],
	"Freeverb": [
		{
			label: "damping / room size",
			type: "position",
			action: function(data) {
				this.unit.dampening.value = data.x;
				this.unit.roomSize.value = data.y;
			},
			size: {
				w: 100,
				h: 60
			}
		}
	],
	"Gate": [
		{
			label: "attack / release",
			type: "position",
			action: function(data) {
				this.unit.attack.value = data.x;
				this.unit.release.value = data.y;
			},
			size: {
				w: 100,
				h: 60
			}
		},
		{
			label: "threshold",
			type: "slider",
			action: function(data) {
				this.unit.threshold.value = nx.toDB(data.value) + 10;
			},
			size: {
				w: 20,
				h: 60
			}
		}
	],
	"FeedbackCombFilter": [
	
	],
	"Panner": [
		{
			label: "pan",
			type: "slider",
			action: function(data) {
				this.unit.pan.value = data.value*2-1;
			},
			size: {
				w: 150,
				h: 25
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
	"Phaser": [
	],
	"Recorder": [
	]
//	"Sampler": [
//	],
//	"WaveShaper": [
//	]
}