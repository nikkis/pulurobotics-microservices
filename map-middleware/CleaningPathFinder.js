const MAP_CONSTANTS = require('./MapConstants');
const robot = require('../command-middleware/robot');

const Jimp = require('jimp');
const Config = require('./config.json');

class CleaningPathFinder {

  constructor() {

    // Two-dimensional array where y-indexes are rows
    this.constraintsMap = [];
    this.firstMapPageIndex = { x: 0, y: 0 };
    this._robotSize = {
      dx: null,
      dy: null
    };

    this._tmpPos = {
      x: 0,
      y: 0,
      angle: 0
    };

    this.initConstraintsMapPages();
    this.setRobotSize();
    
    if (this._robotSize.dx == null) {
      this._robotSize.dx = 16;
    }

    if (this._robotSize.dy == null) {
      this._robotSize.dy = 20;
    }

    console.log("Robot size is: " + this._robotSize.dx + ", " + this._robotSize.dy);
    // Do any other init stuff here
  }


  initConstraintsMapPages() {

    const X_CONSTRAINTS_MAP_PAGES = MAP_CONSTANTS.MAP_PAGES_NUM;
    const Y_CONSTRAINTS_MAP_PAGES = MAP_CONSTANTS.MAP_PAGES_NUM;

    this.firstMapPageIndex = {
      y: (Y_CONSTRAINTS_MAP_PAGES / 2) * MAP_CONSTANTS.MAP_DIM,
      x: ((X_CONSTRAINTS_MAP_PAGES / 2) - 1) * MAP_CONSTANTS.MAP_DIM
    };

    //console.log('firstMapPageIndex_x', this.firstMapPageIndex.x, 'firstMapPageIndex_y', this.firstMapPageIndex.y);

    this.constraintsMap = new Array(Y_CONSTRAINTS_MAP_PAGES * MAP_CONSTANTS.MAP_DIM);
    for (let i = 0; i < this.constraintsMap.length; ++i) {
      this.constraintsMap[i] = new Array(X_CONSTRAINTS_MAP_PAGES * MAP_CONSTANTS.MAP_DIM);
    }
  }

  // robotSize: dimension (i.e. dx, dy) of the robot  // check data structures size_x size_y (from robot.js)

  // Private attributes
  // _tmpPos: temporary position (i.e. x, y, angle) while computing coverage path


  getPath(position, testPng=false) {
    testPng = true;

    if(testPng) {
      testPNG(this.constraintsMap);
    }

    const x_shift = 256;
    const y_shift = 512; 

    console.log("Initial position requested (x,y): (" + position.x + "," + position.y + ")");
    let initPosition = {
      x: (position.x-x_shift),
      y: ((this.constraintsMap.length - position.y)+y_shift)
    };
    if (position.x > this.constraintsMap.length) {
      console.log('Initial position x out of range');
      initPosition.x = 1280;
      console.log('Position x recentered: '+initPosition.x);
    }
    else {
      if (position.y > this.constraintsMap[position.x].length) {
        console.log('Initial position y out of range');
        initPosition.y = 1280;
        console.log('Position y recentered: ' + initPosition.y);
      }
    }
    let coordinateList = [];

    this._tmpPos = initPosition;
    this._tmpPos.angle = 0;

    let X = this._tmpPos.x+x_shift;
    let Y = (this.constraintsMap.length - this._tmpPos.y)+y_shift;
    // Test: init coordinates given as first of the output list
    // coordinateList.push({x:X,y:Y});

    // Replacing all undefined area with obstacles
    /*
    for(let i=0; i<this.constraintsMap.length; i++){
      for(let j=0;j<this.constraintsMap[i].length;j++){
        if (this.constraintsMap[i][j] == null){
          this.constraintsMap[i][j] = 1;
        }
      }
    }
    */

    console.log('Value of _robotSize.dx = ' + this._robotSize.dx);
    let forwardStep = Math.round(this._robotSize.dx); // Step ahead temporary position
    let turns = 0;

    let obstacle = false;

/* Test: transform between x y in constraintsMap and xy in UI
    while(this.constraintsMap[this._tmpPos.y][this._tmpPos.x]!= null){
      while(this.constraintsMap[this._tmpPos.y][this._tmpPos.x]!= null){
        this._tmpPos.x++;
      }
      this._tmpPos.x-=1;
      console.log('constraintsMap[y][x] ='+this.constraintsMap[this._tmpPos.y][this._tmpPos.x]);
      let X1 = (this._tmpPos.x+x_shift);
      let Y1 = (this.constraintsMap.length - this._tmpPos.y) +512;
      coordinateList.push({x:X1,y:Y1});

      this._tmpPos.y -= forwardStep;
      console.log('constraintsMap[y][x] ='+this.constraintsMap[this._tmpPos.y][this._tmpPos.x]);
      let X2 = (this._tmpPos.x+x_shift);
      let Y2 = (this.constraintsMap.length-this._tmpPos.y)+512;
      coordinateList.push({x:X2,y:Y2});

      while(this.constraintsMap[this._tmpPos.y][this._tmpPos.x] != null) {
        this._tmpPos.x--;
      }
      this._tmpPos.x+=1;
      console.log('constraintsMap[y][x] ='+this.constraintsMap[this._tmpPos.y][this._tmpPos.x]);
      let X3 = (this._tmpPos.x+x_shift);
      let Y3 = (this.constraintsMap.length-this._tmpPos.y)+512;
      coordinateList.push({x:X3,y:Y3});

      this._tmpPos.y -= forwardStep;
      console.log('constraintsMap[y][x] ='+this.constraintsMap[this._tmpPos.y][this._tmpPos.x]);
      let X4 = (this._tmpPos.x+x_shift);
      let Y4 = (this.constraintsMap.length-this._tmpPos.y)+512;
      coordinateList.push({x:X4,y:Y4});
    }
 */

    while (1) {
      while (!obstacle) {
        this._tmpPos.x += Math.round(forwardStep * Math.cos(this._tmpPos.angle));
        this._tmpPos.y += Math.round(forwardStep * Math.sin(this._tmpPos.angle));
        // console.log("Before obstacle value of _tmpPos (x,y,angle): ("+this._tmpPos.x+","+this._tmpPos.y+","+this._tmpPos.angle+")");
        obstacle = this.checkObstacle();
      }

      let coord = {
        x: this._tmpPos.x + x_shift,
        y: (this.constraintsMap.length - this._tmpPos.y) + y_shift
      }
      coordinateList.push(coord);
      console.log("Coordinate written after long length: ", coord);
      // console.log("List of coords: ", coordinateList);

      let turnAngle = 0;

      if (turns % 2 == 0) {
        turnAngle = (Math.PI) / 2; // Turn right 90 degrees
      }
      else { turnAngle = -(Math.PI) / 2 } // Turn left 90 degrees

      this._tmpPos.angle += turnAngle; // Turn
      obstacle = this.checkObstacle();
      if (obstacle) {
        console.log("Stopped at corner");
        console.log("List of coords: ", coordinateList);
        return coordinateList;
      } // Ending area covering

      this._tmpPos.x += Math.round(forwardStep * Math.cos(this._tmpPos.angle));
      this._tmpPos.y += Math.round(forwardStep * Math.sin(this._tmpPos.angle));
      let coord1 = {
        x: this._tmpPos.x + x_shift,
        y: (this.constraintsMap.length - this._tmpPos.y) + y_shift
      }

      coordinateList.push(coord1);
      console.log("Coordinate written after short length: ", coord1);
      // console.log("List of coords: ", coordinateList);

      this._tmpPos.angle += turnAngle; // Turn

      turns++; // Counter number of +-180 degrees turns
      console.log("Number of 180 degrees turns is: " + turns);
    }

    console.log("List of coords: ", coordinateList);
    return coordinateList;
  }

  setRobotSize() {
    const ROBOT_SIZE_X = robot.size_x;
    const ROBOT_SIZE_Y = robot.size_y;

    this._robotSize = {
      dx: ROBOT_SIZE_X,
      dy: ROBOT_SIZE_Y
    };

    // console.log("Robot size is: " + this._robotSize.dx +", "+ this._robotSize.dy);
  }

  setSensorArray() {
    let sensorArray = [];
    let sensorSize = this._robotSize.dx;

    if (this._robotSize.dx % 2 != 0) {
      sensorSize++;
    }

    let X = Math.round(sensorSize); // Same as forwardStep
    let Y = - Math.round(sensorSize / 2);
    for (var i = 0; i < (sensorSize + 1); i++) {
      let y = Y + i;
      let sensor = {
        x: X,
        y: y
      };
      sensorArray.push(sensor);
    }

    // Test: print the coordinates in sensorArray
    //for(var i=0; i<sensorArray.length; i++){
    //  console.log("sensorArray["+i+"] = {" + sensorArray[i].x + "," + sensorArray[i].y+"}");
    //}

    return sensorArray;
  }

  /* checkObstacle uses:
    this.constraintsMap
    this.tmpPos
    this.robotSize
    returns true in there is an obstacle in front of tmpPos
  */
  checkObstacle() {

    //    sensorArray in robot own coordinates, the robot looks at its width ahead (dx)
    //       Example of y values if dx=5: (X_1,Y_1) [(dx,-2),(dx,-1),(dx,0),(dx,1),(dx,2)]

    const sensorObstacles = this.setSensorArray();// [{x:0,y:-1},{x:0,y:0},{x:0,y:1}]; //[{x:0,y:-2},{x:0,y:-1},{x:0,y:0},{x:0,y:1},{x:0,y:2}]; // Positions in front of temporary position in robot own coordinates

    let obstacle = false;

    // Find obstacles in front of robot: X_robot position + r*cos(alpha) +
    // int[] frontObstacles = map.(robot(x,y) + (r*cos(alpha), r*sin(alpha)) + (X_1,Y_1)*Jacobian(alpha));
    let frontObstacles = [];
    for (let i = 0; i < sensorObstacles.length; i++) {
      let X = Math.round(this._tmpPos.x +
        (sensorObstacles[i].x * Math.cos(this._tmpPos.angle) - sensorObstacles[i].y * Math.sin(this._tmpPos.angle)));
      let Y = Math.round(this._tmpPos.y +
        (sensorObstacles[i].x * Math.sin(this._tmpPos.angle) + sensorObstacles[i].y * Math.cos(this._tmpPos.angle)));

      // Test: Int values after transform from virtual robot own coordinates to map coordinates
      // console.log("X :" + X);
      // console.log("Y :" + Y);

      if (Y > 0) {
        if (Y < this.constraintsMap.length) {
          if (X > 0) {
            if (X < this.constraintsMap[Y].length) {
              if (this.constraintsMap[Y][X] == null) {
                console.log('Issue constraintsMap[' + Y + '][' + X + '] == null');
                frontObstacles.push(1);
              }
              else {
                frontObstacles.push(this.constraintsMap[Y][X]);
              }
            }
            else {
              console.log("X too big for the size of map");
              frontObstacles.push(1);
            }
          }
          else {
            console.log("X < 0, too small for index in map");
            frontObstacles.push(1);
          }
        }
        else {
          console.log("Y too big for the size of map");
          frontObstacles.push(1);
        }
      }
      else {
        console.log("Y < 0, too small for index in map");
        frontObstacles.push(1);
      }
    }

    console.log('Size of frontObstacles ' + frontObstacles.length);
    console.log('_tmpPos = (' + this._tmpPos.x + ',' + this._tmpPos.y + ', angle= ' + this._tmpPos.angle + ')');

    // Test: checking the size of the array in front of _tmpPos
    // console.log("Size of frontObstacles " + frontObstacles.length);
    if (frontObstacles.length == 0) {
      console.log("Error: frontObstacles empty");
      return true;
    }

    let count = 0;
    for (var i = 0; i < frontObstacles.length; i++) {
      if (frontObstacles[i] == 1) {
        count++;
      }

      // Test: Used for checking all values in front of _tmpPos
      // console.log("Value " + i + " of frontObstacles: " + frontObstacles[i]);
    }

    if (count > 0){ //Math.round(frontObstacles.length/8)) {//(count > 0){ // Different options of front obstacles (count == frontObstacles.length){
      obstacle = true;
    }

    if (obstacle == true) {
      console.log('Number of obstacles in front of _tmpPos: ' + count);
      console.log('Obstacle found in front of coordinate: (' + this._tmpPos.x + ',' + this._tmpPos.y + ')');
    }
    return obstacle;

  }

  /**
   * 
   * @param mapPageConstraints two-dimensional array
   * 
   */
  setMapPageConstraints(mapPageConstraints, mapPageId) {
    try {

      const firstPageIndexY = 127;
      const firstPageIndexX = 127;

      const pageIndex = this.getPageIndexFromPageId(mapPageId);

      const xIndex = (pageIndex.x - firstPageIndexX) * MAP_CONSTANTS.MAP_DIM + this.firstMapPageIndex.x;
      const yIndex = (pageIndex.y - firstPageIndexY) * MAP_CONSTANTS.MAP_DIM + this.firstMapPageIndex.y;

      console.log('xIndex', xIndex, 'yIndex', yIndex);

      let mapPageX = 0, mapPageY = 0;
      for (let y = yIndex; y < yIndex + MAP_CONSTANTS.MAP_DIM; y++) {
        for (let x = xIndex; x < xIndex + MAP_CONSTANTS.MAP_DIM; x++) {
          this.constraintsMap[y][x] = mapPageConstraints[mapPageY][mapPageX];
          mapPageX++;
        }
        mapPageX = 0;
        mapPageY++;
      }

      return;

    } catch (error) {
      console.error('Error while setting map page constraints', mapPageId, error);
      return;
    }
  }

  // Helpers

  getPageIndexFromPageId(pageId) {
    let robotId, worldId, x, y;
    [robotId, worldId, x, y] = pageId.split('_');
    return {
      x: parseInt(x),
      y: parseInt(y)
    };
  }

}


module.exports = CleaningPathFinder;



function testPNG(mapData) {

  const color1 = Jimp.cssColorToHex('#000000');
  const color0 = Jimp.cssColorToHex('#f4f067');
  const colorUndef = Jimp.cssColorToHex('#bebebe');

  const imgData = [...Array(MAP_CONSTANTS.MAP_DIM * Config.mapPagesNum)].map(x => Array(MAP_CONSTANTS.MAP_DIM * Config.mapPagesNum).fill(0));

  for (let y = 0; y < mapData.length; y++) {
    for (let x = 0; x < mapData[y].length; x++) {
      const p = mapData[y][x];
      if (p === 1) {
        imgData[y][x] = color1;
      } else if (p === 0) {
        imgData[y][x] = color0;
      } else if (p === undefined) {
        imgData[y][x] = colorUndef;
      } else {
        console.log('SOMETHING WRONG');
      }
    }
  }

  writePngFile('./test.png', imgData);



  function writePngFile(src, data) {
    console.log('Writing map');

    new Jimp(MAP_CONSTANTS.MAP_DIM * Config.mapPagesNum, MAP_CONSTANTS.MAP_DIM * Config.mapPagesNum, 0xFFFFFFFF, function (err, image) {
      try {
        if (err) throw err;

        data.forEach((row, y) => {
          row.forEach((color, x) => {
            image
              .setPixelColor(color, x, y);
          });
        });

        image.write(src, (err) => {
          if (err) throw err;
        });

      } catch (error) {
        console.error(error);
      }
    });
  }

}