//var width = 600, height = 600; // Width and height of simulation in pixels.
var width = 1200, height = 600; // Width and height of simulation in pixels.
var cellSize = 6; // Size of a cell in pixels.
var yCellCount = Math.floor(height/cellSize); // Number of cells in the up-down direction.
var xCellCount = Math.floor(width/cellSize); // Number of cells in the left-right direction.

function randcell() {
	return Math.floor(Math.random()*xCellCount);
}


var context = $("#canvas").get(0).getContext("2d");

context.canvas.width = width;
context.canvas.height = height;

function neighbours(x,y) {
	var n = grid[x%xCellCount][(xCellCount+y-1)%yCellCount];
	n += grid[x%xCellCount][(y+1)%yCellCount];
	n += grid[(x+1)%xCellCount][y%yCellCount];
	n += grid[(xCellCount+x-1)%xCellCount][y%yCellCount];
	return n;
}

function neighbours2(x,y) {
  var off = 	Math.floor(Math.random() * 2) * 2 - 1;
  var dir = 	Math.floor(Math.random() * 2);
  
  return [(x + (off * dir) + xCellCount)%xCellCount , (y + (off * (1 - dir)) + yCellCount)%yCellCount];
}

function neighbours3(x,y) {
  var m = 	Math.floor(Math.random() *xCellCount);
  var n=    Math.floor(Math.random() *yCellCount);
  return [m,n];
}

var lambda = 0.7;
var epsilon = 0.1;
var bias = 0.1;
var alpha = 0;
var numStates = 5;
var slow = 0;
var grid;

var paused = false;
var loop;

var smoothie = new SmoothieChart({
  grid: {
    fillStyle:'rgb(100, 100, 100)'
  },
  tooltip: true,
  maxValue:xCellCount*yCellCount,
  minValue:0
});
smoothie.streamTo(document.getElementById("graph"));
var gridlines = [];

function makeBlankGrid() {
	// First, we make a new array of rows. Then we set those rows.
	var grid = new Array(xCellCount);
	for (var i = 0; i < xCellCount; i++) {
		grid[i] = new Array(yCellCount);
		for (var j = 0; j < grid[i].length; j++) {
			grid[i][j] = Math.floor(Math.random() * numStates) - (numStates - 1) / 2;
		}
	}
	
	gridlines = [];
	for (var s = 0; s < numStates; s++) {
	  gridlines[s] = new TimeSeries();
	  var r = (Math.min(s - (numStates - 1) / 2, 0) + (numStates - 1) / 2) / ((numStates - 1) / 2) * -255 + 255;
	  var b = Math.max(s - (numStates - 1) / 2, 0) / ((numStates - 1) / 2) * 255;
	  smoothie.addTimeSeries(gridlines[s], { strokeStyle:'rgb('+r+', 0, '+b+')', fillStyle:'rgba('+r+', 0, '+b+', 0)', lineWidth:2 });
	}
	
	return grid;
}

function drawGrid(grid) {
  const imageData = context.getImageData(0, 0, width, height);
  
	for (var y = 0; y < yCellCount; y++) {
		for (var x = 0; x < xCellCount; x++) {
		  var r = (Math.min(grid[x][y], 0) + (numStates - 1) / 2) / ((numStates - 1) / 2) * -255 + 255;
		  var b = Math.max(grid[x][y], 0) / ((numStates - 1) / 2) * 255;
		  for (var i = 0; i < cellSize; i++) {
		    for (var j = 0; j < cellSize; j++) {
				  imageData.data[(y*cellSize*width + x*cellSize + i * width + j)*4 + 0] = r;
				  imageData.data[(y*cellSize*width + x*cellSize + i * width + j)*4 + 1] = 0;
				  imageData.data[(y*cellSize*width + x*cellSize + i * width + j)*4 + 2] = b;
		    }
		  }
		}
	}
	
	context.putImageData(imageData, 0, 0);
}

function pausePlay() {
  if (paused) {
    this.innerHTML = "Go";
    clearInterval(loop);
    loop = setInterval(mainLoop, Math.pow(1000, slow) - 1);
  }
  else {
    this.innerHTML = "Stop";
    clearInterval(loop);
  }
  paused = !paused;
}

function reset() {
  grid = makeBlankGrid();
}

function slowDown() {
  slow = parseFloat($("#slow").val());
  $("#sdisplay").html(Math.round(Math.pow(1000, slow) - 1)+"");
  
  clearInterval(loop);
  loop = setInterval(mainLoop, Math.pow(1000, slow) - 1);
}

function mainLoop() {
	lambda = parseFloat($("#lambda").val());
	$("#ldisplay").html(lambda+"");
	epsilon = parseFloat($("#epsilon").val());
	$("#edisplay").html(epsilon+"");
	alpha = parseFloat($("#alpha").val());
	$("#adisplay").html(alpha+"");
	bias = parseFloat($("#bias").val());
	$("#bdisplay").html(bias+"");
	numStates = parseFloat($("#states").val());
	$("#stdisplay").html(numStates+"");
	lattice = $('#radio-lattice')[0].checked;
	fullyConnected = $('#radio-fullnetwork')[0].checked;
	

	// Run simulation step.
	var x0, y0, state, neigh;
	for (var i = 0; i < yCellCount * xCellCount; i++) {
		x0 = randcell();
		y0 = randcell();
		var ne;
		if (lattice) {
		  ne = neighbours2(x0, y0);
		} else if (fullyConnected) {
		  ne = neighbours3(x0, y0);
		} else {
		  ne = [x0, y0]; // When nothing is selected, should not happen
		}
		var x = ne[0];
		var y = ne[1];
		neigh = grid[x][y];
		state = grid[x0][y0];

//		if ( Math.abs(neigh)==(Math.abs(state)+1) ) {
		if ( Math.abs(neigh)==(Math.abs(state)+1) & Math.abs(state - neigh) == 1 ) {
		  if (Math.random() < lambda) {
				grid[x0][y0] = neigh; 
			} else {
			  grid[x][y] = state;
			}
		}
		
		if (state !== 0 && Math.random() < epsilon + Math.abs(bias) * (Math.sign (grid[x0][y0]) * Math.sign (bias) + 1)/-2) {
			grid[x0][y0] = grid[x0][y0] - Math.sign (grid[x0][y0]);
		}
		
	  if(neigh==state && Math.random() < alpha && Math.abs(state) < (numStates-1) / 2 && state !== 0) {
				grid[x0][y0] = grid[x0][y0] + Math.sign (grid[x0][y0]);
	  }
		}

  var stateStats = [];
  for (var s = 0; s < numStates; s++) {
    stateStats.push(0);
  }
  for (var x = 0; x < xCellCount; x++) {
    for (var y = 0; y < yCellCount; y++) {
      stateStats[grid[x][y] + (numStates-1) / 2]++;
    }
  }
  for (var s = 0; s < numStates; s++) {
    gridlines[s].append(new Date().getTime(), stateStats[s])
  }
	
	context.fillRect(0, 0, width, height);
	drawGrid(grid);
}
	
grid = makeBlankGrid();
loop = setInterval(mainLoop, Math.pow(1000, slow) - 1);