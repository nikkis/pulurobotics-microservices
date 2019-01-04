const Jimp = require('Jimp');

const MAP_CONSTANTS = require('./MapConstants');


class BinaryToPng {
  constructor(binary) {
    this.data = binary;
    this.imageData = null;
  }

  generateImageToFile(src, mapPageId, next=null) {

    try {
      let aByte, byteStr;

      this.imageData = [...Array(MAP_CONSTANTS.MAP_DIM)].map(x => Array(MAP_CONSTANTS.MAP_DIM).fill(0));

      let i = 0, y = 0, x = 0;
      for (i = 0; i < this.data.length; i += 8) {

        aByte = this.data[i];
        byteStr = aByte.toString(2);

        // Check for rows
        if (y === MAP_CONSTANTS.MAP_DIM) {
          y = 0;
          ++x;
        }

        const color = this.getColorForCoordinate(byteStr);
        this.imageData[y][x] = color;

        y++;
      }

      this.writePngFile(src, mapPageId, next);

    } catch (error) {
      console.error(error);
    }
  }

  writePngFile(src, mapPageId, next=null) {

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
          if(next) {
            next(mapPageId);
          }
        });

      } catch (error) {
        console.error(error);
      }

    });
  }



  getColorForCoordinate(binary) {

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
    if ((binary & elemetMask) === elemetMask)
      return MAP_CONSTANTS.MAP_COLORS.COLOR_UNIT_MAPPED;


    //console.log('Should no be the case');
    return MAP_CONSTANTS.MAP_COLORS.COLOR_UNIT_FREE;




  }
};



module.exports = BinaryToPng;

/*
const o = new BinaryToImage(imageData);
o.generateImageToFile('juu.png');
*/