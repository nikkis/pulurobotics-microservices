
/* Clean Area
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
const map = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1]
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1]
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1]
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1]
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1]
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1]
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

const position = {
    x: 2,
    y: 3,
    angle: 30
}

let coordinateList = [];
coordinateList = cleanArea(map, position);

console.log("Coordinate list: " + coordinateList);

function cleanArea(map, position){
    let coordinateList = [];

    let tmpPos = {
        x: position.x,
        y: position.y,
        angle: position.angle
    }

    const forwardStep = 50; //Step ahead temporary position
    let turns = 0;

    let obstacle = false;

    while(1){
        while(!obstacle){
            tmpPos.x += forwardStep*Math.cos(tmpPos.angle)
            tmpPos.y += forwardStep*Math.sin(tmpPos.angle);
            obstacle = checkObstacle(map, tmpPos, forwardStep);
        }

        coordinateList.add(tmpPos);

        let turnAngle;

        if (turns%2 == 0){
            turnAngle = -90; // Turn right 90 degrees
        }
        else {turnAngle = 90} // Turn left 90 degrees
        
        tmpPos.angle += turnAngle; // Turn
        obstacle = checkObstacle(map, tmpPos, forwardStep);
        if (obstacle) break; // Ending area covering

        tmpPos.x += forwardStep*Math.cos(tmpPos.angle);
        tmpPos.y += forwardStep*Math.sin(tmpPos.angle);
        coordinateList.add(tmpPos);

        tmpPos.angle += turnAngle; // Turn
        
        turns+=1; // Counter number of +-180 degrees turns
    }

    return coordinateList;
}

// Returns true if obstacle in front of the robot
let obstacle = function checkObstacle(map, position, radius){
    const r = radius;
    
    //    sensorArray in robot own coordinates
    //       (X_1,Y_1) [(0,-2),(0,-1),(0,0),(0,1),(0,2)]
    const sensorObstacles = [(0,-2),(0,-1),(0,0),(0,1),(0,2)]; // Positions in front of temporary position in robot own coordinates

    let obstacle = false;

    // Find obstacles in front of robot: X_robot position + r*cos(alpha) +
    // int[] frontObstacles = map.(robot(x,y) + (r*cos(alpha), r*sin(alpha)) + (X_1,Y_1)*Jacobian(alpha));
    let frontObstacles = [];
    var i;
    for (i=0; i<sensorObstacles.length; i++){
        frontObstacles.add(map.get(
            position.x + 
            r*Math.cos(position.angle) + 
            (sensorObstacles[i].x * Math.cos(position.angle) - sensorObstacles[i].y * Math.sin(position.angle)),
            position.y +
            r*Math.sin(position.angle) + 
            (sensorObstacles[i].x * Math.sin(position.angle) + sensorObstacles[i].y * Math.cos(position.angle))
            ));
    }

    if (frontObstacles.contains(1))
        obstacle = true;

    return obstacle;
};