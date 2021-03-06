const Config = require('./config.json');
const Jimp = require('jimp');

const MAP_DIM = 256;
const MAP_PAGE_SIZE = Config.mapPagesNum;

const FILE_SIZE_OLD_MAP = 524288;
const FILE_SIZE_NEW_MAP_32 = 336901;
const FILE_SIZE_NEW_MAP_64 = 599045;


const MAP_FORMATS = {
  [FILE_SIZE_OLD_MAP]: {
    type: 'old',
    inverse: -1,
    pixelToMM: 40
  },
  [FILE_SIZE_NEW_MAP_32]: {
    type: 'new32bit',
    inverse: 1,
    pixelToMM: 50
  },
  [FILE_SIZE_NEW_MAP_64]: {
    type: 'new64bit',
    inverse: 1,
    pixelToMM: 50
  }
};


const MAP_PAGES_NUM = 10;

// Map data format
const MAP_BIN = {
  UNIT_FREE: 0, //                  0000 0000
  UNIT_ITEM: (1 << 0), //           0000 0001 (1<<0) Small obstacle, detected by sonars or bumping into it
  UNIT_WALL: (1 << 1), //           0000 0010 (1<<1) Obstacle seen by the lidar.
  UNIT_INVISIBLE_WALL: (1 << 2), // 0000 0100 (1<<2) Only found out by collision
  UNIT_3D_WALL: (1 << 3), //        0000 1000 (1<<3) Wall seen by 3DTOF, can't be removed by lidar.
  UNIT_DROP: (1 << 4), //           0001 0000 (1<<4)
  UNIT_DBG: (1 << 6), //            0100 0000 (1<<6)
  UNIT_MAPPED: (1 << 7) //          1000 0000 (1<<7) We have seen this area. 
};

// Colors
const MAP_COLORS = {
  COLOR_UNIT_FREE: 0x00000000, //           #f4f067
  COLOR_UNIT_ITEM: 0xf4f067ff, //           #f4f067
  COLOR_UNIT_WALL: 0xe867e8ff, //           #e867e8
  COLOR_UNIT_INVISIBLE_WALL: 0x44FFFFff, // #44FFFF
  COLOR_UNIT_3D_WALL: 0xf4064aff, //        #f4064a
  COLOR_UNIT_DROP: 0xefa630ff, //           #efa630
  COLOR_UNIT_DBG: 0x000000ff, //            #000000

  COLOR_UNIT_MAPPED: Jimp.cssColorToHex('#b4f9b7'),
  COLOR_UNIT_MAPPED_1: Jimp.cssColorToHex('#b4d6aa'),
  COLOR_UNIT_MAPPED_2: Jimp.cssColorToHex('#b3d4a9'),
  COLOR_UNIT_MAPPED_3: Jimp.cssColorToHex('#a9caa1')

};


module.exports = {
  MAP_DIM,
  
  FILE_SIZE_OLD_MAP,
  FILE_SIZE_NEW_MAP_32,
  FILE_SIZE_NEW_MAP_64,

  FILE_SIZES: [
    FILE_SIZE_OLD_MAP,
    FILE_SIZE_NEW_MAP_32,
    FILE_SIZE_NEW_MAP_64
  ],
  
  MAP_FORMATS,
  MAP_DEFAULT_FORMAT: FILE_SIZE_NEW_MAP_32,

  MAP_PAGE_SIZE,
  MAP_PAGES_NUM,
  MAP_BIN,
  MAP_COLORS
};
