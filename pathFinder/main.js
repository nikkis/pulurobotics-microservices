
// Class path finder
// This class produces a list of coordinates to cover an area of the map

/* getPath (default mode:zig-zag) This function can be expanded to give coordinates according to a covering pattern
* (e.g. zig-zag, ellipse, wall following, random)
* This function inputs are: a map of the room to clean and the initial position of the robot (x, y, direction)
* It outputs a list of coordinates (variable coordinateList) where the robot needs to go in order to clean an area of this room
* The trajectory for covering this area is forming a Zig-Zag shape
*/

/* input1: map is a binary map of the room where 0 means free space and 1 means an obstacle
* Example:  11111111111111
*           1000000000000
*           1000000000
* This is a corner of the room
*/

/* input2: position contains:
*          - the initial coordinates (x,y), and
*          - the direction (alpha angle from x direction, range from -Pi to Pi) of the robot in the room
*/

// Class pathfinder
// method loadMap: takes map files from map folder data/ and loads it as const map variable
// public method getPath: method returning a list of coordinates for the robot to go through
// method createPath: computes coordinates points for the robot to go through according to a covering shape (zig-zag, follow wall, ellipse, etc.)
//

class Pathfinder{

// Attributes
_path = [];     // List of points for the robot to go through
_map = [];      // A two dimensional array with of binaris (1 for obstacle, 0 where it's free to go)
_position;      // Robot position at initialization of pathFinder
_tmpPosition;   // temporary position used during computation of path
_robotSize = {
    dx:1, 
    dy:1
};              // Robot size at the scale of map

    constructor(map, position){
        this.map = map;
        this.position = position;
    }

    updateMap(map){
        this.map=map;
    }

    getPath(mode){
        this.mode = mode;
        return this._path;
    }

    this._path = createPath(){
        switch (this.mode){
            case zig-zag:
                let coordinateList = [];

                let tmpPos = {
                    x: this._position.x,
                    y: this._position.y,
                    angle: this._position.angle
                }
        
                let forwardStep = 1; //Math.round((robotSize+1)/2); //Step ahead temporary position
                let turns = 0;
        
                let obstacle = false;
        
                while(1){
                    while(!obstacle){
                        tmpPos.x += Math.round(forwardStep*Math.cos(tmpPos.angle));
                        tmpPos.y += Math.round(forwardStep*Math.sin(tmpPos.angle));
                        obstacle = checkObstacle(map, tmpPos, forwardStep);
                    }
        
                    let coord = {
                        x: tmpPos.x,
                        y: tmpPos.y
                    }
                    coordinateList.push(coord);
                    console.log("Coordinate written after long length: ", coord);
                    console.log("List of coords: ", coordinateList);
        
                 let turnAngle = 0;
                    
                    if (turns%2 == 0){
                        turnAngle = (Math.PI)/2; // Turn right 90 degrees
                    }
                    else {turnAngle = -(Math.PI)/2} // Turn left 90 degrees
                
                    tmpPos.angle += turnAngle; // Turn
                    obstacle = checkObstacle(map, tmpPos, forwardStep);
                    if (obstacle) {
                        console.log("Stopped at corner")
                        return;
                    } // Ending area covering
        
                    tmpPos.x += Math.round(forwardStep*Math.cos(tmpPos.angle));
                    tmpPos.y += Math.round(forwardStep*Math.sin(tmpPos.angle));
                    let coord1 = {
                        x: tmpPos.x,
                        y: tmpPos.y
                    }
        
                    coordinateList.push(coord1);
                    console.log("Coordinate written after short length: ", coord);
                    console.log("List of coords: ", coordinateList);
        
                    tmpPos.angle += turnAngle; // Turn
                
                    turns++; // Counter number of +-180 degrees turns
                    console.log("Number of 180 degrees turns is: " + turns);
                }
        
            return coordinateList;
        }
    }
}

const map = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

const position = {
    x: 1,
    y: 1,
    angle: 0
}

//const robotSize = 3;

// let coordinateList = [];
coordinateList = createPath(map, position);

console.log("Coordinate list: ", coordinateList);

function createPath(map, position){
    let coordinateList = [];

    let tmpPos = {
        x: position.x,
        y: position.y,
        angle: position.angle
    }

    let forwardStep = 1; //Math.round((robotSize+1)/2); //Step ahead temporary position
    let turns = 0;

    let obstacle = false;

    while(1){
        while(!obstacle){
            tmpPos.x += Math.round(forwardStep*Math.cos(tmpPos.angle));
            tmpPos.y += Math.round(forwardStep*Math.sin(tmpPos.angle));
            obstacle = checkObstacle(map, tmpPos, forwardStep);
        }

        let coord = {
            x: tmpPos.x,
            y: tmpPos.y
        }
        coordinateList.push(coord);
        console.log("Coordinate written after long length: ", coord);
        console.log("List of coords: ", coordinateList);

        let turnAngle = 0;

        if (turns%2 == 0){
            turnAngle = (Math.PI)/2; // Turn right 90 degrees
        }
        else {turnAngle = -(Math.PI)/2} // Turn left 90 degrees
        
        tmpPos.angle += turnAngle; // Turn
        obstacle = checkObstacle(map, tmpPos, forwardStep);
        if (obstacle) {
            console.log("Stopped at corner")
            break;
        } // Ending area covering

        tmpPos.x += Math.round(forwardStep*Math.cos(tmpPos.angle));
        tmpPos.y += Math.round(forwardStep*Math.sin(tmpPos.angle));
        let coord1 = {
            x: tmpPos.x,
            y: tmpPos.y
        }

        coordinateList.push(coord1);
        console.log("Coordinate written after short length: ", coord);
        console.log("List of coords: ", coordinateList);

        tmpPos.angle += turnAngle; // Turn
        
        turns++; // Counter number of +-180 degrees turns
        console.log("Number of 180 degrees turns is: " + turns);
    }

    return coordinateList;
}

// Returns true if obstacle in front of the robot
function checkObstacle(map, position, radius){
    const r = radius;
    
    //    sensorArray in robot own coordinates
    //       (X_1,Y_1) [(0,-2),(0,-1),(0,0),(0,1),(0,2)]
    // TODO: change sensorObstacles as a function of robotSize
    const sensorObstacles = [{x:0,y:0}];// [{x:0,y:-1},{x:0,y:0},{x:0,y:1}]; //[{x:0,y:-2},{x:0,y:-1},{x:0,y:0},{x:0,y:1},{x:0,y:2}]; // Positions in front of temporary position in robot own coordinates

    let obstacle = false;

    // Find obstacles in front of robot: X_robot position + r*cos(alpha) +
    // int[] frontObstacles = map.(robot(x,y) + (r*cos(alpha), r*sin(alpha)) + (X_1,Y_1)*Jacobian(alpha));
    let frontObstacles = [];
    for (var i=0; i<sensorObstacles.length; i++){
        let X = Math.round(position.x + 
            r*Math.cos(position.angle) + 
            (sensorObstacles[i].x * Math.cos(position.angle) - sensorObstacles[i].y * Math.sin(position.angle)));
        let Y = Math.round(position.y +
            r*Math.sin(position.angle) + 
            (sensorObstacles[i].x * Math.sin(position.angle) + sensorObstacles[i].y * Math.cos(position.angle)));
        console.log("X :" + X);
        console.log("Y :" + Y);
        frontObstacles.push(map[X][Y]);
    }
    console.log("Size of frontObstacles " + frontObstacles.length);

    for(var i=0; i<frontObstacles.length; i++){
        if (frontObstacles[i] == 1){
            obstacle = true;    
        }
        console.log("Value " + i + " of frontObstacles: " + frontObstacles[i]);
    }

    return obstacle;
};

module.exports = Pathfinder;