
const MAP_CONSTANTS = require('./MapConstants');

class CleaningPathFinder {

  constructor() {

    // Two-dimensional array where y-indexes are rows
    this.constraintsMap = [];
    this.firstMapPageIndex = { x: 0, y: 0 };

    this.initConstraintsMapPages();

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