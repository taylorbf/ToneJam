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
					+ '<div class="emptyrack emptyugen">UGEN</div>'
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
	var unit = new Tone[Parts[type].type]()
	rack(unit,type,type,parent,shelfNum,ugen)
	unit.toMaster();
}

var rack = function (unit,unitname,unittitle,parent,shelfNum,ugen) {

	var rackid = "rack"+rackindex
	rackindex++
	var rackinfo = Parts[unitname]
	var parts = rackinfo.widgets;

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
	title.innerHTML = rackinfo.type
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
		if (parts[i].init) {
			parts[i].init.bind(widget)();
		}

	/*	if (!ugen) {
			widget.colors.accent = "#333"
			widget.init();
		} */


		var action = parts[i].action
		action = action.bind(widget)
		widget.on('*', action)
		if (parts[i].initial) {
			widget.set(parts[i].initial, true)
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
			widget.unit.dispose();
			if (widget.ToneInt) { Tone.Transport.clearInterval(widget.ToneInt)}
		}
		chain.splice(chain.indexOf(widget.unit),1);
		parent.removeChild(container)
		for (var i=0;i<chain.length;i++) {
			chain[i].disconnect()
			if (i<chain.length-1) {
				chain[i].connect(chain[i+1])
			} else {
				chain[i].toMaster()
			}
		}
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

	if (parts.type=="Player") {
		unit.load("audio/"+media[0], function() { })
	}

}

var major = [0,2,4,5,7,9,11,12]

var Parts = {
	"Player.Loop": {
		type: "Player",
		ugen: true,
		widgets:[
			{
				label: "on/off",
				type: "toggle",
				action: function(data) {
					if (data.value) {
						this.unit.loop = true;
						this.unit.start();
					} else {
						this.unit.loop = false
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
				label: "speed",
				type: "dial",
				action: function(data) {
					this.unit.playbackRate = data.value*2;
				},
				initial: {
					value: 0.5
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
					this.unit.load("audio/"+data.text, function() { })
				},
				size: {
					w: 90,
					h: 30
				},
				init: function() {
					this.choices = media
					this.init();
					this.unit.load("audio/"+this.choices[0], function() { })
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
	},
	"Player.Seq": {
		type: "Player",
		ugen: true,
		widgets:[{
				label: "bpm",
				type: "dial",
				action: function(data) {
					Tone.Transport.bpm.value = nx.scale(data.value,0,1,0,240)
				},
				initial: {
					"value": 0.5
				}
			},
			{
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
					this.unit.load("audio/"+data.text, function() { 
						this.unit.hasBuffer = true;
						this.unit.retrigger = true;
					}.bind(this))
				},
				size: {
					w: 90,
					h: 30
				},
				init: function() {
					this.choices = media
					this.init();
					this.unit.load("audio/"+this.choices[0], function() { })
				}
			},{
				label: "pitch",
				type: "matrix",
				action: function(data) {
					if (this.unit.hasBuffer && data.list) {
						for (var i=0;i<data.list.length;i++) {
							if (data.list[i]) {
								this.unit.start();
								this.unit.playbackRate = Math.pow(2,(major[i]-12)/12);
							}
						}
					}
				},
				size: {
					w: 400,
					h: 200
				},
				init: function() {
					this.col = 16;
					this.row = 8;
					this.init();
					Tone.Transport.setTimeout(function(time){
						Tone.Transport.setInterval(function(time){
						    this.jumpToCol(this.place)
						    this.place++;
						    if (this.place>=this.col) {
						    	this.place=0;
						    }
						}.bind(this), "24n");
					}.bind(this),Tone.Transport.nextBeat('1n'))
				} 
			}
		],
	},
	"AMSynth.Keys": {
		type: "AMSynth",
		ugen: true,
		widgets: [
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
			label: "mod",
			type: "dial",
			action: function(data) {
				this.unit.harmonicity = data.value;
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
	]},
	"AMSynth.Seq": {
		type: "AMSynth",
		ugen: true,
		widgets: [
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
			label: "mod ?",
			type: "dial",
			action: function(data) {
				this.unit.harmonicity = data.value;
			}
		},{
			label: "glide",
			type: "dial",
			action: function(data) {
				this.unit.portamento = data.value;
			}
		},{
			label: "pitch",
			type: "matrix",
			action: function(data) {
				if (data.list) {
					for (var i=0;i<data.list.length;i++) {
						if (data.list[i]) {
							var note = nx.mtof(major[i]+60)
							this.unit.triggerAttackRelease(note,'64n')
						}
					}
				}
			},
			size: {
				w: 400,
				h: 200
			},
			init: function() {
				this.col = 16;
				this.row = 8;
				this.init();
				Tone.Transport.setTimeout(function(time){
					this.ToneInt = Tone.Transport.setInterval(function(time){
					    this.jumpToCol(this.place)
					    this.place++;
					    if (this.place>=this.col) {
					    	this.place=0;
					    }
					}.bind(this), "24n");
				}.bind(this),Tone.Transport.nextBeat('1n'))
			} 
		}
	]},
	"FMSynth.Keys": {
		type: "FMSynth",
		ugen: true,
		widgets: [
		{
			label: "volume",
			type: "dial",
			action: function(data) {
				this.unit.volume.rampTo(nx.toDB(data.value),1);
			},
			initial: {
				"value": 0.45
			}
		},{
			label: "harm",
			type: "dial",
			action: function(data) {
				this.unit.harmonicity = data.value*5;
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
						this.unit.setNote(nx.mtof(data.note))
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
	]},
	"FMSynth.Seq": {
		type: "FMSynth",
		ugen: true,
		widgets: [
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
				this.unit.harmonicity = data.value*5;
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
			type: "matrix",
			action: function(data) {
				if (data.list) {
					for (var i=0;i<data.list.length;i++) {
						if (data.list[i]) {
							var note = nx.mtof(major[i]+48)
							this.unit.triggerAttackRelease(note,'64n')
						}
					}
				}
			},
			size: {
				w: 400,
				h: 200
			},
			init: function() {
				this.col = 16;
				this.row = 8;
				this.init();
				Tone.Transport.setTimeout(function(time){
					this.ToneInt = Tone.Transport.setInterval(function(time){
					    this.jumpToCol(this.place)
					    this.place++;
					    if (this.place>=this.col) {
					    	this.place=0;
					    }
					}.bind(this), "24n");
				}.bind(this),Tone.Transport.nextBeat('1n'))
			} 
		}
	]},
	"Microphone": {
		type: "Microphone",
		ugen: true,
		widgets: [
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
			label: "on/off (<span style='color:red'>WARNING: FEEDBACK</span>)",
			type: "toggle",
			action: function(data) {
				if (data.value) {
					this.unit.start();
				} else {
					this.unit.stop();
				}
			}
		}
	]},
	"Noise": {
		type: "Noise",
		ugen: true,
		widgets: [
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
			},
			initial: {
				value: 0.75
			}
		},
		{
			label: "type",
			type: "tabs",
			action: function(data) {
				this.unit.type = data.text;
			},
			init: function() {
				this.options = ["white","pink","brown"]
				this.init()
			}
		}
	]},
	"PluckSynth": {
		type: "PluckSynth",
		ugen: true,
		widgets: [
		{
			label: "volume",
			type: "dial",
			action: function(data) {
				this.unit.volume.value = nx.toDB(data.value)+20;
			},
			initial: {
				value: 0.8
			}
		},
		{
			label: "damp ?",
			type: "dial",
			action: function(data) {
				this.unit.dampening.value = data.value*400;
			}
		},
		{
			label: "resonance ?",
			type: "dial",
			action: function(data) {
				this.unit.resonance.value = data.value*100;
			}
		},{
			label: "pitch ?",
			type: "keyboard",
			action: function(data) {
				if (data.on) {
					this.unit.triggerAttack(nx.mtof(data.note))
				} else {
				//	this.unit.triggerRelease()
				}
			},
			size: {
				w: 170,
				h: 40
			}
		}
	]},
//	"PolySynth": [
//	],
	"AutoPanner": {
		type: "AutoPanner",
		ugen: false,
		widgets: [
		{
			label: "on/off",
			type: "toggle",
			action: function(data) {
				if (data.value) {
					this.unit.start();
				}
			},
			initial: {
				value: 1
			}
		},
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
				this.unit.frequency.value = data.value*20;
			},
			initial: {
				value: 0.05
			}
		}
	]},
	"BitCrusher": {
		type: "BitCrusher",
		ugen: false,
		widgets: [
		{
			label: "bits",
			type: "dial",
			action: function(data) {
				this.unit.bits = ~~(data.value*24);
			},
			initial: {
				value: 0.2
			}
		},
		{
			label: "wet",
			type: "dial",
			action: function(data) {
				this.unit.wet.value = data.value;
			},
			initial: {
				value: 0.1
			}
		}
	]},
/*	"Chebyshev": {
		type: "Chebyshev",
		ugen: false,
		widgets: [
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
	]}, */
	"EQ": {
		type: "EQ",
		ugen: false,
		widgets: [
		{
			label: "low",
			type: "position",
			action: function(data) {
				this.unit.low.value = nx.invert(data.y)*-50+5
				this.unit.lowFrequency.value = data.x*1000
			},
			initial: {
				x: 1,
				y: 0.95
			},
			size: {
				w: 180,
				h: 100
			}
		},
		{
			label: "m",
			type: "position",
			action: function(data) {
				this.unit.mid.value = nx.invert(data.y)*-50+5
			},
			initial: {
				x: 0,
				y: 0.95
			},
			size: {
				w: 21,
				h: 100
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
				x: 0,
				y: 0.95
			},
			size: {
				w: 180,
				h: 100
			}
		}
	]},
	"Freeverb": {
		type: "Freeverb",
		ugen: false,
		widgets: [
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
			},
			initial: {
				x: 0.5,
				y: 0.2
			}
		}
	]},
	"Gate": {
		type: "Gate",
		ugen: false,
		widgets: [
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
				this.unit.threshold = nx.toDB(data.value) + 10;
			},
			size: {
				w: 20,
				h: 60
			}
		}
	]},
	"FeedbackCombFilter": {
		type: "FeedbackCombFilter",
		ugen: false,
		widgets: [
		{
			label: "reson",
			type: "dial",
			action: function(data) {
				this.unit.resonance.value = data.value
			}
		},
		{
			label: "pitch ?",
			type: "keyboard",
			action: function(data) {
				if (data.on) {
					console.log(1/(nx.mtof(data.note)+24))
					this.unit.delayTime = 1/(nx.mtof(data.note)+24)
				}
			},
			size: {
				w: 250,
				h: 50
			},
			init: function() {
				this.unit.minDelay = 0.0001
			}
		}
	]},
	"Panner": {
		type: "Panner",
		ugen: false,
		widgets: [
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
	]},
	"PingPongDelay": {
		type: "PingPongDelay",
		ugen: false,
		widgets: [
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
	]},
	"Phaser": {
		type: "Phaser",
		ugen: false,
		widgets: [
		{
			label: "base ?",
			type: "dial",
			action: function(data) {
				this.unit.baseFrequency = data.value * 1000
			},
			initial: {
				value: 0.4
			}
		},
		{
			label: "depth ?",
			type: "dial",
			action: function(data) {
				this.unit.depth = data.value * 20
			},
			initial: {
				value: 0.5
			}
		},
		{
			label: "freq ? ",
			type: "dial",
			action: function(data) {
				this.unit.frequency.value = data.value
			},
			initial: {
				value: 0.5
			}
		},
		{
			label: "wet",
			type: "dial",
			action: function(data) {
				this.unit.wet.value = data.value
			},
			initial: {
				value: 0.1
			}
		}
	]}
//	"Recorder": [
//	]
//	"Sampler": [
//	],
//	"WaveShaper": [
//	] */
}