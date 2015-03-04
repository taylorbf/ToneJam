var colindex = 0;
var rackindex = 0;
var items = new Array();
var media = new Array();
var shelves = new Array();

var shelf = function() {
	var self = this;
	this.index = shelves.length;
	this.hasUGen = false;
	this.make = function() {
		var htmlstr = '<div class="dropzone" id="dropzone'+this.index+'">'
					+ '<div class="emptyrack emptyugen">Signals</div>'
					+ '<div class="racks"></div>'
					+ '<div class="emptyrack emptyfx">FX</div>'
					+ '</div>';
		$("#shelves").append(htmlstr)
		this.droppable();
	}
	this.units = new Array();
	this.droppable = function() {
		$("#dropzone"+self.index).droppable({
			over: function(event,ui) {
				if (ui.draggable[0].className.indexOf("ugen")>=0) {
					$(this).find(".emptyugen").css("border-style", "solid")
				} else {
					$(this).find(".emptyfx").css("border-style", "solid")
				}
			},
			out: function(event,ui) {
				$(this).find(".emptyrack").css("border-style", "dashed")
			},
			drop: function( event, ui ) {
				var ugen = (ui.draggable[0].className.indexOf("ugen")>=0) ? true : false
				if (ugen && self.hasUGen) {
					return;
				}
				addRack(ui.draggable[0].innerHTML,$(this).find(".racks")[0],$(this).attr("id"),ugen)
				if (ugen) {
	       			$(this).find(".emptyugen").hide()
	       			self.hasUGen = true;
	       		}
	       		if (self.index==shelves.length-1) {
					addShelf()
				}
	       		$(this).find(".emptyrack").css("border-style", "dashed")
	        }
		})
	}
}

function addShelf() {
	shelves.push(new shelf())
	shelves[shelves.length-1].make();
}

function addRack(type,parent,shelfNum,ugen) {
	shelfNum = shelfNum.replace("dropzone","")
	var unit = new Tone[type]()
	rack(unit,type,type,parent,shelfNum,ugen)
	unit.toMaster();
}

var rack = function (unit,unittype,unittitle,parent,shelfNum,ugen) {

	var rackid = "rack"+rackindex
	rackindex++
	var parts = Parts[unittype]

	var container = document.createElement("div")
	container.setAttribute("class", "rackunit")
	if (ugen) {
		container.setAttribute("class", container.className + " ugenrack")
	}
	container.id = rackid
	if (ugen) {
		$([parent]).prepend(container)
	} else {
		parent.appendChild(container)
	}

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

	/*	if (!ugen) {
			widget.colors.accent = "#333"
			widget.init();
		} */

		if (parts[i].type=="select") {
			widget.choices = media
			widget.init();
		} 

		var action = parts[i].action
		action = action.bind(widget)
		widget.on('*', action)
		if (parts[i].initial) {
			widget.set(parts[i].initial)
		}

		var label = document.createElement("div")
		label.setAttribute("class", "racklabel")
		label.innerHTML = parts[i].label
		col.appendChild(label)

	}

	var chain = shelves[shelfNum].units

	var closer = document.createElement("div")
	closer.setAttribute("class", "closer")
	closer.innerHTML = "x"
	container.appendChild(closer)
	closer.onclick = function() {
		if (container.className.indexOf("ugen")>=0) {
			shelves[shelfNum].hasUGen = false;
			$("#dropzone"+shelfNum).find(".emptyugen").show(0)
		}
		chain.splice(chain.indexOf(widget.unit),1);
		parent.removeChild(container)
	}


	if (ugen) {
		chain.unshift(widget.unit);
	} else {
		chain.push(widget.unit);
	}
	

	for (var i=0;i<chain.length;i++) {
		chain[i].disconnect()
		if (i<chain.length-1) {
			chain[i].connect(chain[i+1])
		} else {
			chain[i].toMaster()
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
		{
			label: "volume",
			type: "dial",
			action: function(data) {
				this.unit.volume.rampTo(nx.toDB(data.value),1);
			},
			initial: {
				"value": 0.75
			}
		},{
			label: "harm",
			type: "dial",
			action: function(data) {
				this.unit.harmonicity = data.value*100;
			}
		},{
			label: "mod index",
			type: "dial",
			action: function(data) {
				this.unit.modulationIndex = data.value*100;
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
	"Microphone": [
		{
			label: "volume",
			type: "dial",
			action: function(data) {
				this.unit.volume.value = nx.toDB(data.value);
			},
			initial: {
				value: 0.5
			}
		},
		{
			label: "record (<span style='color:red'>WARNING: FEEDBACK</span>)",
			type: "toggle",
			action: function(data) {
				if (data.value) {
					this.unit.start();
				} else {
					this.unit.stop();
				}
			}
		}
	],
	"Noise": [
		{
			label: "on/off",
			type: "toggle",
			action: function(data) {
				if (data.value) {
					this.unit.start();
				} else {
					this.unit.stop();
				}
			}
		},
		{
			label: "volume",
			type: "dial",
			action: function(data) {
				this.unit.volume.value = nx.toDB(data.value);
			}
		},
		{
			label: "type",
			type: "tabs",
			action: function(data) {
				this.unit.type = data.text;
			}
		}
	],
	"PluckSynth": [
		{
			label: "volume",
			type: "dial",
			action: function(data) {
				this.unit.volume.value = nx.toDB(data.value)+5;
			}
		},
		{
			label: "resonance",
			type: "dial",
			action: function(data) {
				this.unit.resonance.value = data.value;
			}
		},{
			label: "pitch",
			type: "keyboard",
			action: function(data) {
				if (data.on) {
					this.unit.triggerAttack(Math.pow(2,(data.note-60)/12)*220)
				} else {
				//	this.unit.triggerRelease()
				}
			},
			size: {
				w: 230,
				h: 50
			}
		}
	],
//	"PolySynth": [
//	],
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
			label: "damping / size",
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
			label: "cut",
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
		{
			label: "threshold",
			type: "dial",
			action: function(data) {
				this.unit.resonance.value = data.value
			}
		},
		{
			label: "threshold",
			type: "keyboard",
			action: function(data) {
				if (data.on) {
					this.unit.delayTime = 1/nx.mtof(data.note)
				}
			},
			size: {
				w: 250,
				h: 50
			}
		}
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
				this.unit.delayTime.value = data.x*2
				this.unit.feedback.value = data.y*0.99
			},
			size: {
				w: 150,
				h: 50
			}
		}
	],
	"Phaser": [
		{
			label: "base",
			type: "dial",
			action: function(data) {
				this.unit.baseFrequency = data.value
			}
		},
		{
			label: "depth",
			type: "dial",
			action: function(data) {
				this.unit.depth = data.value
			}
		},
		{
			label: "freq",
			type: "dial",
			action: function(data) {
				this.unit.frequency.value = data.value
			}
		},
		{
			label: "wet",
			type: "dial",
			action: function(data) {
				this.unit.wet.value = data.value
			}
		}
	]
//	"Recorder": [
//	]
//	"Sampler": [
//	],
//	"WaveShaper": [
//	]
}