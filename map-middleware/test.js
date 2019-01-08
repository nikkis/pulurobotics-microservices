const CleaningPathFinder = require('./CleaningPathFinder');
const testmode = true;

try{
    this.pathFinder = new CleaningPathFinder(testmode);
}
catch(error){
    console.error(error);
}
let position = {
    x: 2,
    y: 2,
    angle: 45
};

let robotSize = {
    size_x:2,
    size_y:2
};

//this.pathfinder.setRobotSize(robotSize.size_x,robotSize.size_y);

this.pathFinder.getPath(position);