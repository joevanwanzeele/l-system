// using L-systems to create tree-like structures with javascript and the canvas object.
// need a 'seed'
// a transformation
// a start point.
//
// format:  F = move forward one step, drawing a line, in current direction     
//          f = move forward one step without drawing a line, in current direction.
//          X = do nothing
//          + = turn left at specified angle
//          - = turn right at specified angle
//          [ = begin branch
//          ] = end branch

var canvas;
var ctx;
var presets = [];
var currentPresent;


presets[0] = {
	name: "Feathery Tree",
	startAngle: 18, 
	startWord: "++++X", 	
	trans1A: "X",
	trans1B: "F+[[X]-X-[X]]-F-F-F-",
	trans2A: "F",
	trans2B: "FF[+F]",
	iterations: 5
	}
	
presets[1] = {
	name: "Koch Snowflake",
	startAngle: 60,
	startWord: "F",
	trans1A: "F",
	trans1B: "F+F--F+F",
	trans2A: "",
	trans2B: "",
	iterations: 5
	}
	
presets[2] = {
	name: "Square Pants",
	startAngle: 45,
	startWord: "++X",
	trans1A: "X",
	trans1B: "F[++X][+F--F][-F++F][--X]",
	trans2A: "F",
	trans2B: "FF",
	iterations: 6
	}


presets[3] = {
	name: "Sierpinski Triangle",
	startAngle: 60,
	startWord: "X",
	trans1A: "X",
	trans1B: "--FXF++FXF++FXF--",
	trans2A: "F",
	trans2B: "FF",
	iterations: 5
}

presets[4] = {
	name: "Tree-like Tree",
	startAngle: 18,
	startWord: "+++X",
	trans1A: "X",
	trans1B: "+F-[FX]+X[+X]-",
	trans2A: "F",
	trans2B: "FF",
	iterations: 5
}


var initX = document.documentElement.clientWidth / 2.2;
var initY = document.documentElement.clientHeight;
var initAngle = 18;
var initWord = "++++X";
var initTransform1A = "X";
var initTransform1B = "F+[[X]-X-[X]]-F-F-F-";
var initTransform2A = "F";
var initTransform2B = "FF[+F]";
var initIterations = 5;
var initShowWord = false;


document.observe("dom:loaded", function() {
    $("treeContainer").setStyle({
        height: document.documentElement.clientHeight,
        width: document.documentElement.clientWidth
    });

    $('startStateX').value = $F('startStateX') == '' ? initX : $F('startStateX');
    $('startStateY').value = $F('startStateY') == '' ? initY : $F('startStateY');
    $('startStateAngle').value = $F('startStateAngle') == '' ? initAngle : $F('startStateAngle');
    $('startWord').value = $F('startWord') == '' ? initWord : $F('startWord');
    $('transformation1A').value = $F('transformation1A') == '' ? initTransform1A : $F('transformation1A');
    $('transformation1B').value = $F('transformation1B') == '' ? initTransform1B : $F('transformation1B');
    $('transformation2A').value = $F('transformation2A') == '' ? initTransform2A : $F('transformation2A');
    $('transformation2B').value = $F('transformation2B') == '' ? initTransform2B : $F('transformation2B');
    $('numberOfIterations').value = $F('numberOfIterations') == '' ? initIterations : $F('numberOfIterations');
    $('showGeneratedWord').checked = initShowWord;
	populatePresetList();	
    canvas = $("treeContainer");
    ctx = canvas.getContext("2d");
});

Tree = function(obj) {
    this.rule = [null, null];
    this.angle = obj.angle;
    this.state = obj.state; //(x, y, a)  this will initially be the starting point.  a is in radians
    this.word = obj.word;
    if (obj.rule1 != "") this.rule[0] = obj.rule1;
    if (obj.rule2 != "") this.rule[1] = obj.rule2;
    this.stepLength = 6; //number of pixels to draw each step.
    this.trunk = [];
    this.color = "000000";
    this.endColor = "FFFFFF";
    this.width = 2; //line width
}

Tree.prototype = {
    iterate: function() {

        if (this.rule[0].b != "") {
            this.word = this.word.gsub(this.rule[0].a, this.rule[0].b);
        }
        if (this.rule[1].b != "") {
            this.word = this.word.gsub(this.rule[1].a, this.rule[1].b);
        }
    },

    draw: function() {
        var i = 0;
        var tree = this;
        new PeriodicalExecuter(function(pe) {
            switch (tree.word[i]) {
                case "F":
                    var newX = (tree.state.x - 0) + ((tree.stepLength - 0) * Math.cos(tree.state.a - 0) * -1);
                    var newY = (tree.state.y - 0) + ((tree.stepLength - 0) * Math.sin(tree.state.a - 0) * -1);
                    var gradient = ctx.createLinearGradient(tree.state.x, tree.state.y, newX, newY);
                    ctx.strokeStyle = getColor(tree.color, tree.endColor, tree.trunk.length * 10);
                    ctx.lineWidth = tree.width;
                    ctx.lineCap = "round";
                    ctx.beginPath();
                    ctx.moveTo(tree.state.x, tree.state.y);
                    ctx.lineTo(newX, newY);
                    ctx.stroke();
                    tree.setState(newX, newY, tree.state.a);
                    break;
                case "f":
                    var newX = tree.state.x + (tree.stepLength * Math.cos(tree.state.a));
                    var newY = tree.position.y + (tree.stepLength * Math.sin(tree.state.a));
                    tree.setState(newX, newY, tree.state.a);
                    break;
                case "+": //face left at specified angle from current state.
                    tree.setState(tree.state.x, tree.state.y, tree.state.a + tree.angle);
                    break;
                case "-": //face right at specified angle from current state
                    tree.setState(tree.state.x, tree.state.y, tree.state.a - tree.angle);
                    break;
                case "[": //push current state onto stack (branch)
                    tree.trunk[tree.trunk.length] = new Object({ x: tree.state.x, y: tree.state.y, a: tree.state.a });
                    break;
                case "]": //pop last state off of stack (end branch)
                    var lastState = tree.trunk[tree.trunk.length - 1];
                    if (lastState) {
                        tree.setState(lastState.x, lastState.y, lastState.a);
                        tree.trunk[tree.trunk.length - 1] = null;
                        tree.trunk = $(tree.trunk).compact();
                    }
                    break;
            }
            i++;

            if (i == tree.word.length) {
                alert("drawing complete");
                pe.stop();
            }
        }, .005);
    },

    setState: function(x, y, a) {
        this.state.x = x;
        this.state.y = y;
        this.state.a = a;
    }
}

function growTree() {
    var iterations = $F('numberOfIterations');
    //alert("iterations: " + iterations);
    var myTree = new Tree({
        angle: $('startStateAngle').value * .0174533,
        state: { x: $F('startStateX'), y: $F('startStateY'), a: $F('startStateAngle') * .0174533 },
        word: $('startWord').value,
        rule1: { a: $F('transformation1A'), b: $F('transformation1B') },
        rule2: { a: $F('transformation2A'), b: $F('transformation2B') }
    });
    //alert("tree made");


    for (var i = 0; i < iterations; i++) {
        myTree.iterate();
    }

    if ($('showGeneratedWord').checked)
    { alert(myTree.word); }

    myTree.draw();

}

function setXY(e) {
    $('startStateX').value = Event.pointerX(e);
    $('startStateY').value = Event.pointerY(e);
}

function clearScreen() {
    canvas.width = canvas.width;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.stroke();
}

function loadPreset(){	
	var presetNumber = $F('presetSelection');
	$('startWord').value = presets[presetNumber].startWord;
	$('startStateAngle').value = presets[presetNumber].startAngle;
	$('transformation1A').value = presets[presetNumber].trans1A;
	$('transformation1B').value = presets[presetNumber].trans1B;	
	$('transformation2A').value = presets[presetNumber].trans2A;
	$('transformation2B').value = presets[presetNumber].trans2B;
	$('numberOfIterations').value = presets[presetNumber].iterations;
}

function populatePresetList()
{
	for (var i=0; i<presets.length; i++)
	{
		$('presetSelection')[i] = new Option(presets[i].name, i);
	}
}	


/***********************************************
*
* Function : getColor
*
* Parameters : start - the start color (in the form "RRGGBB" e.g. "FF00AC")
* end - the end color (in the form "RRGGBB" e.g. "FF00AC")
* percent - the percent (0-100) of the fade between start & end
*
* returns : color in the form "#RRGGBB" e.g. "#FA13CE"
*
* Description : This is a utility function. Given a start and end color and
* a percentage fade it returns a color in between the 2 colors
*
* Author : Open Source
*
*************************************************/
function getColor(end, start, percent) {
    function hex2dec(hex) { return (parseInt(hex, 16)); }
    function dec2hex(dec) { return (dec < 16 ? "0" : "") + dec.toString(16); }

    var r1 = hex2dec(start.slice(0, 2));
    var g1 = hex2dec(start.slice(2, 4));
    var b1 = hex2dec(start.slice(4, 6));

    var r2 = hex2dec(end.slice(0, 2));
    var g2 = hex2dec(end.slice(2, 4));
    var b2 = hex2dec(end.slice(4, 6));

    var pc = percent / 100;

    var r = Math.floor(r1 + (pc * (r2 - r1)) + .5);
    var g = Math.floor(g1 + (pc * (g2 - g1)) + .5);
    var b = Math.floor(b1 + (pc * (b2 - b1)) + .5);

    return ("#" + dec2hex(r) + dec2hex(g) + dec2hex(b));
}


