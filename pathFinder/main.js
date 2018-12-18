console.log('moi! moijhghj!');

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


function cleanArea(map, position){
    let coordinateList = [];

    let tmpPos = {
        x: position.x,
        y: position.y,
        angle: position.angle
    }

    const forwardStep = 50;
    let turns = 0;

    Boolean obstacle = false;

    while(1){
        while(!obstacle){
            tmpPos += (forwardStep*cos(tmpPos.alpha),forwardStep*sin(tmpPos.alpha));
            obstacle = checkObstacle(map, tmpPos, forwardStep);
        }

        coordinateList.add(tmpPos);

        if (turns%2 == 0){
            tmpPos = turn(-Pi/2); //Turn right 90 degrees
            obstacle = checkObstacle(map, tmpPos, forwardStep);
            if (obstacle) break; // Ending area covering

            tmpPos += (forwardStep*cos(tmpPos.alpha),forwardStep*sin(tmpPos.alpha));
            coordinateList.add(tmpPos);

            tmpPos = turn(-Pi/2); //Turn right 90 degrees
        }
        else{
            tmpPos = turn(Pi/2); //Turn left 90 degrees
            obstacle = checkObstacle(map, tmpPos, forwardStep);
            if (obstacle) break; // Ending area covering

            tmpPos += (forwardStep*cos(tmpPos.alpha),forwardStep*sin(tmpPos.alpha));
            coordinateList.add(tmpPos);

            tmpPos = turn(Pi/2); //Turn left 90 degrees
        }
        turns+=1;
    }

    return coordinateList;
}

%% Returns 1 if obstacle in front of the robot
boolean checkObstacle(map, position, radius){
    int r = radius;

    boolean obstacle = false;

    %    sensorArray in robot coordinates
    %       (X_1,Y_1) [(0,-2),(0,-1),(0,0),(0,1),(0,2)]

    % Find obstacles in front of robot: X_robot position + r*cos(alpha) +
    % int[] frontObstacles = map.(robot(x,y) + (r*cos(alpha), r*sin(alpha)) + (X_1,Y_1)*Jacobian(alpha));

    if (frontObstacles.contains(1))
        obstacle = true;

    return obstacle;
}