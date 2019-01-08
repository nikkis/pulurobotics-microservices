
const MAP_CONSTANTS = require('./MapConstants');

class CleaningPathFinder {

  constructor() {

    // Two-dimensional array where y-indexes are rows
    this.constraintsMap = [];
    this.firstMapPageIndex = { x: 0, y: 0 };

    const testmode = true;

    if (testmode){
      this.constraintsMap = [
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
      ];
    }
    else{

      //this.initConstraintsMapPages();

      // Do any other init stuff here
    }

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


  getPath(position){
    let coordinateList = [];
        
                let forwardStep = this.robotSize.dx; //Math.round((robotSize+1)/2); //Step ahead temporary position
                let turns = 0;
        
                let obstacle = false;
        
                while(1){
                    while(!obstacle){
                        this._tmpPos.x += Math.round(forwardStep*Math.cos(this._tmpPos.angle));
                        this._tmpPos.y += Math.round(forwardStep*Math.sin(this._tmpPos.angle));
                        obstacle = checkObstacle();
                    }
        
                    let coord = {
                        x: this._tmpPos.x,
                        y: this._tmpPos.y
                    }
                    coordinateList.push(coord);
                    console.log("Coordinate written after long length: ", coord);
                    console.log("List of coords: ", coordinateList);
        
                 let turnAngle = 0;
                    
                    if (turns%2 == 0){
                        turnAngle = (Math.PI)/2; // Turn right 90 degrees
                    }
                    else {turnAngle = -(Math.PI)/2} // Turn left 90 degrees
                
                    this._tmpPos.angle += turnAngle; // Turn
                    obstacle = checkObstacle();
                    if (obstacle) {
                        console.log("Stopped at corner")
                        return;
                    } // Ending area covering
        
                    this._tmpPos.x += Math.round(forwardStep*Math.cos(this._tmpPos.angle));
                    this._tmpPos.y += Math.round(forwardStep*Math.sin(this._tmpPos.angle));
                    let coord1 = {
                        x: this._tmpPos.x,
                        y: this._tmpPos.y
                    }
        
                    coordinateList.push(coord1);
                    console.log("Coordinate written after short length: ", coord);
                    console.log("List of coords: ", coordinateList);
        
                    this._tmpPos.angle += turnAngle; // Turn
                
                    turns++; // Counter number of +-180 degrees turns
                    console.log("Number of 180 degrees turns is: " + turns);
                }
        
            return coordinateList;
  }

  setRobotSize(size_x, size_y){
    this.robotSize = {
      dx: size_x,
      dy: size_y
    }
  }

  setSensorArray(){
    let sensorArray = [];
    let X = this.robotSize.dx; // Same as forwardStep

    let Y = - Math.round(this.robotSize.dx/2);
    for (var i = 0; i<this.robotSize.dx; i++){
      Y += i;
      if (this.robotSize.dx%2 == 0){
        if(Y==0){
          Y++;
        }
      }
      sensorArray.push({x:X,y:Y});
    }

    return sensorArray;
  }

  /* checkObstacle uses:
    this.constraintsMap
    this.tmpPos
    this.robotSize

    returns true in there is an obstacle in front of tmpPos
  */
  checkObstacle(){
    
    //    sensorArray in robot own coordinates, the robot looks at its width ahead (dx)
    //       Example of y values if dx=5: (X_1,Y_1) [(dx,-2),(dx,-1),(dx,0),(dx,1),(dx,2)]

    const sensorObstacles = setSensorArray();// [{x:0,y:-1},{x:0,y:0},{x:0,y:1}]; //[{x:0,y:-2},{x:0,y:-1},{x:0,y:0},{x:0,y:1},{x:0,y:2}]; // Positions in front of temporary position in robot own coordinates

    let obstacle = false;

    // Find obstacles in front of robot: X_robot position + r*cos(alpha) +
    // int[] frontObstacles = map.(robot(x,y) + (r*cos(alpha), r*sin(alpha)) + (X_1,Y_1)*Jacobian(alpha));
    let frontObstacles = [];
    for (var i=0; i<sensorObstacles.length; i++){
        let X = Math.round(this._tmpPos.x + 
            (sensorObstacles[i].x * Math.cos(this._tmpPos.angle) - sensorObstacles[i].y * Math.sin(this._tmpPos.angle)));
        let Y = Math.round(this._tmpPos.y + 
            (sensorObstacles[i].x * Math.sin(this._tmpPos.angle) + sensorObstacles[i].y * Math.cos(this._tmpPos.angle)));
        console.log("X :" + X);
        console.log("Y :" + Y);
        frontObstacles.push(this.constraintsMap[X][Y]);
    }
    console.log("Size of frontObstacles " + frontObstacles.length);

    for(var i=0; i<frontObstacles.length; i++){
        if (frontObstacles[i] == 1){
            obstacle = true;    
        }
        console.log("Value " + i + " of frontObstacles: " + frontObstacles[i]);
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