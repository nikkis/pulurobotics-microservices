
/*
    // Map unit is a 40mm*40mm area. Memory usage is carefully considered, because the world is a 2D map of the map units.
    // 40mm*40mm was selected as a good compromise between accuracy (i.e., considering that the 500mm wide robot can maneuver through
    // tight passages, which would be wasteful if the unit was larger) and memory/disk usage.

    typedef struct __attribute__ ((packed))
    {
      uint8_t result;   	// Mapping result decided based on all available data.
      uint8_t latest;  	// Mapping result based on last scan.

      uint8_t timestamp;	// Latest time scanned
      uint8_t num_visited;    // Incremented when lidar is mapped with this robot coord. Saturated at 255.

      uint8_t num_seen;  	// Number of times mapped. Saturated at 255.
      uint8_t num_obstacles;  // "is an obstacle" BY LIDAR counter. Every time mapped, ++ if obstacle, -- if not. Saturated at 255.

      uint8_t constraints;
      uint8_t num_3d_obstacles; // ++ if 3D_WALL, DROP, or ITEM. Set to 0 if those are removed.
    } map_unit_t;
    */


const Jimp = require('jimp');

const MAP_CONSTANTS = require('./MapConstants');


class BinaryToPng {
  constructor(binary) {
    this.data = binary;
    this.imageData = null;
  }

  generateImageToFile(src, mapPageId, notifyCB, constraintsCB = null) {

    try {

      ////// Constraints
      let mapPageConstraints = new Array(MAP_CONSTANTS.MAP_DIM);
      for (let i = 0; i < mapPageConstraints.length; ++i) {
        mapPageConstraints[i] = new Array(MAP_CONSTANTS.MAP_DIM);
      }
      //////


      let aByte, byteStr, numVisited;

      this.imageData = [...Array(MAP_CONSTANTS.MAP_DIM)].map(x => Array(MAP_CONSTANTS.MAP_DIM).fill(0));

      let i = 0, y = 0, x = 0;
      for (i = 0; i < this.data.length; i += 8) {

        aByte = this.data[i];
        byteStr = aByte.toString(2);


        try {
          numVisited = this.data[i + 3];
        } catch (error) {
          console.error(error);
        }

        // Check for rows
        if (y === MAP_CONSTANTS.MAP_DIM) {
          y = 0;
          ++x;
        }

        const color = this.getColorForCoordinate(byteStr, numVisited);
        this.imageData[y][x] = color;

        ////// Constraints
        if (color !== MAP_CONSTANTS.MAP_COLORS.COLOR_UNIT_FREE) {
          mapPageConstraints[y][x] = 1;
        } else {
          mapPageConstraints[y][x] = 0;
        }
        //////

        y++;
      }

      this.writePngFile(src, mapPageId, notifyCB);

      ////// Constraints
      if (constraintsCB) {
        constraintsCB(mapPageConstraints, mapPageId);
      }
      //////

    } catch (error) {
      console.error(error);
    }
  }

  writePngFile(src, mapPageId, notifyCB) {

    console.log('Writing img', mapPageId);

    const that = this;
    let image = new Jimp(MAP_CONSTANTS.MAP_DIM, MAP_CONSTANTS.MAP_DIM, function (err, image) {
      try {

        if (err) throw err;

        that.imageData.forEach((row, y) => {
          row.forEach((color, x) => {
            image.setPixelColor(color, x, y);
          });
        });

        image.write(src, (err) => {
          if (err) throw err;
          console.log('Finished!');
          if (notifyCB) {
            notifyCB(mapPageId);
          }
        });

      } catch (error) {
        console.error(error);
      }

    });
  }



  getColorForCoordinate(binary, numVisited = null) {

    if (binary.length === 1 && binary === '0')
      return MAP_CONSTANTS.MAP_COLORS.COLOR_UNIT_FREE;

    let elemetMask = MAP_CONSTANTS.MAP_BIN.UNIT_ITEM
    if ((binary & elemetMask) === elemetMask)
      return MAP_CONSTANTS.MAP_COLORS.COLOR_UNIT_ITEM;

    elemetMask = MAP_CONSTANTS.MAP_BIN.UNIT_WALL
    if ((binary & elemetMask) === elemetMask)
      return MAP_CONSTANTS.MAP_COLORS.COLOR_UNIT_WALL;

    elemetMask = MAP_CONSTANTS.MAP_BIN.UNIT_INVISIBLE_WALL
    if ((binary & elemetMask) === elemetMask)
      return MAP_CONSTANTS.MAP_COLORS.COLOR_UNIT_INVISIBLE_WALL;

    elemetMask = MAP_CONSTANTS.MAP_BIN.UNIT_3D_WALL
    if ((binary & elemetMask) === elemetMask)
      return MAP_CONSTANTS.MAP_COLORS.COLOR_UNIT_3D_WALL;

    elemetMask = MAP_CONSTANTS.MAP_BIN.UNIT_DROP
    if ((binary & elemetMask) === elemetMask)
      return MAP_CONSTANTS.MAP_COLORS.COLOR_UNIT_DROP;

    elemetMask = MAP_CONSTANTS.MAP_BIN.UNIT_DBG
    if ((binary & elemetMask) === elemetMask)
      return MAP_CONSTANTS.MAP_COLORS.COLOR_UNIT_DBG;


    elemetMask = MAP_CONSTANTS.MAP_BIN.UNIT_MAPPED
    if ((binary & elemetMask) === elemetMask) {
      if (numVisited && numVisited >= 3) {
        return MAP_CONSTANTS.MAP_COLORS.COLOR_UNIT_MAPPED_3;
      } else if (numVisited && numVisited === 2) {
        return MAP_CONSTANTS.MAP_COLORS.COLOR_UNIT_MAPPED_2;
      } else if (numVisited && numVisited === 1) {
        return MAP_CONSTANTS.MAP_COLORS.COLOR_UNIT_MAPPED_1;
      } else {
        return MAP_CONSTANTS.MAP_COLORS.COLOR_UNIT_MAPPED;
      }
    }


    //console.log('Should no be the case');
    return MAP_CONSTANTS.MAP_COLORS.COLOR_UNIT_FREE;




  }
};



module.exports = BinaryToPng;

/*
const o = new BinaryToImage(imageData);
o.generateImageToFile('juu.png');
*/