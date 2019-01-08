
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

    /*
    this.colors = [
      Jimp.rgbaToInt(189,	53, 215, 255),
      Jimp.rgbaToInt(122,	53,	215	, 255),
      Jimp.rgbaToInt(106,	119,	216	, 255),
      Jimp.rgbaToInt(60,	99,	235, 255),

      Jimp.cssColorToHex('#44FFFF'),
      Jimp.cssColorToHex('#f4064a'),
      Jimp.cssColorToHex('#efa630'),
      Jimp.cssColorToHex('#e867e8'),
      Jimp.cssColorToHex('#ffffff'),

      Jimp.rgbaToInt(211, 233, 189, 255),
      Jimp.rgbaToInt(211, 233, 189, 255),
      Jimp.rgbaToInt(211, 233, 189, 255),
      Jimp.rgbaToInt(211, 233, 189, 255),
      Jimp.rgbaToInt(211, 233, 189, 255),
      Jimp.rgbaToInt(211, 233, 189, 255),
      Jimp.rgbaToInt(211, 233, 189, 255)

    ];*/
    const VOXMAP_ALPHA = 255;

    this.colors1 = [
      /* 0           */ Jimp.rgbaToInt(220, 50, 220, VOXMAP_ALPHA),
      /* 1           */ Jimp.rgbaToInt(140, 50, 220, VOXMAP_ALPHA),
      /* 2           */ Jimp.rgbaToInt(100, 120, 220, VOXMAP_ALPHA),
      /* 3           */ Jimp.rgbaToInt(20, 100, 240, VOXMAP_ALPHA),
      /* 4           */ Jimp.rgbaToInt(0, 130, 200, VOXMAP_ALPHA),
      /* 5           */ Jimp.rgbaToInt(0, 160, 160, VOXMAP_ALPHA),
      /* 6           */ Jimp.rgbaToInt(0, 200, 130, VOXMAP_ALPHA),
      /* 7           */ Jimp.rgbaToInt(0, 220, 70, VOXMAP_ALPHA)
    ];

    this.colors2 = [
      /* 8           */ Jimp.rgbaToInt(0, 250, 0, VOXMAP_ALPHA),
      /* 9           */ Jimp.rgbaToInt(50, 220, 0, VOXMAP_ALPHA),
      /* 10          */ Jimp.rgbaToInt(90, 190, 0, VOXMAP_ALPHA),
      /* 11          */ Jimp.rgbaToInt(120, 150, 0, VOXMAP_ALPHA),
      /* 12          */ Jimp.rgbaToInt(150, 120, 0, VOXMAP_ALPHA),
      /* 13          */ Jimp.rgbaToInt(190, 90, 0, VOXMAP_ALPHA),
      /* 14          */ Jimp.rgbaToInt(220, 50, 0, VOXMAP_ALPHA),
      /* 15          */ Jimp.rgbaToInt(250, 0, 0, VOXMAP_ALPHA),
    ];


    this.voxmapBlankColor = Jimp.rgbaToInt(0, 0, 0, 50);
    this.forbiddenColor = Jimp.rgbaToInt(255, 190, 190, 255);

  }

  generateImageToFile(src, mapPageId, notifyCB, constraintsCB = null) {

    try {

      ////// Constraints
      let mapPageConstraints = new Array(MAP_CONSTANTS.MAP_DIM);
      for (let i = 0; i < mapPageConstraints.length; ++i) {
        mapPageConstraints[i] = new Array(MAP_CONSTANTS.MAP_DIM);
      }
      //////

      this.imageData = [...Array(MAP_CONSTANTS.MAP_DIM)].map(x => Array(MAP_CONSTANTS.MAP_DIM).fill(0));

      console.log('this.data.length', this.data.length);

      const imgData = new Uint8Array(this.data);


      let aByte, byteStr, numVisited;



      const int32Array = Int32Array.from(imgData);
      const baseLevel = int32Array[0];
      console.log('baseLevel', baseLevel);
      console.log('int32Array.length', int32Array.length);
      let k = 4;
      if (int32Array.length === MAP_CONSTANTS.FILE_SIZE_NEW_MAP_64) {
        k = 8;
      }

      const voxelData = imgData.slice(4, 4 + k * MAP_CONSTANTS.MAP_DIM * MAP_CONSTANTS.MAP_DIM);

      let i = 0, y = 0, x = 0;
      for (i = 0; i < voxelData.length; i += k) {

        // Check for rows
        if (x === MAP_CONSTANTS.MAP_DIM) {
          x = 0;
          ++y;
        }

        this.imageData[y][x] = this.voxmapBlankColor;

        aByte = voxelData[i];
        byteStr = aByte.toString(2);
        for (let slice = 0; slice < byteStr.length; slice++) {
          if (aByte & (1 << slice)) {
            this.imageData[y][x] = this.colors1[slice];
          }
        }

        aByte = voxelData[i + 1];
        byteStr = aByte.toString(2);
        for (let slice = 0; slice < byteStr.length; slice++) {
          if (aByte & (1 << slice)) {
            this.imageData[y][x] = this.colors2[slice];
          }
        }

        x++;
      }


      /*
let xx = 0;
let K = 0;
const cur_slice = 8;
const MAP_PAGE_W = MAP_CONSTANTS.MAP_DIM;
let tempImgPixels = new Array(MAP_PAGE_W * MAP_PAGE_W);
for (let x = 0; x < MAP_PAGE_W; x++) {
  for (let y = 0; y < MAP_PAGE_W; y++) {
    if (false) { //page -> meta[(y / 2) * (MAP_PAGE_W / 2) + (x / 2)].constraints & CONSTRAINT_FORBIDDEN) {
      //pixels[(MAP_PAGE_W - 1 - y) * MAP_PAGE_W + x] = this.forbiddenColor;
    }
    else {
      const val = voxelData[y * MAP_PAGE_W + xx];
      tempImgPixels[(MAP_PAGE_W - 1 - y) * MAP_PAGE_W + x] = this.voxmapBlankColor;
      for (let slice = 0; slice < cur_slice; slice++) {
        if (val & (1 << slice))
          tempImgPixels[(MAP_PAGE_W - 1 - y) * MAP_PAGE_W + x] = this.colors1[slice];
      }
    }
    xx += 4;
  }
}


let y = 0, x = 0;
for (let i = 0; i < tempImgPixels.length; i++) {
  // Check for rows
  if (x === MAP_CONSTANTS.MAP_DIM) {
    x = 0;
    ++y;
  }
  this.imageData[y][x] = tempImgPixels[i];
  ++x;
}*/



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