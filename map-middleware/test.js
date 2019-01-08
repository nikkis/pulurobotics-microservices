const CleaningPathFinder = require('./CleaningPathFinder');
const testmode = true;
this.pathFinder = new CleaningPathFinder();
let position = {
    x: 3,
    y:4,
    angle: 90
};

pathfinder.setRobotSize(2, 2);
pathFinder.getPath(position);

console.log('moi');