
/*

// From: https://github.com/siwastaja/robotsoft/blob/master/mapping.h

typedef struct __attribute__ ((packed))
{
	uint8_t timestamp;	// Latest time scanned
	uint8_t num_visited;    // Incremented when mapped with this robot coord. Saturated at 255.
	uint8_t constraints;
	uint8_t reserved;
} map_unit_meta_t;

typedef struct  __attribute__ ((packed))
{
	
		Voxel map:
		1 bit per voxel: something's there, or isn't.
		An example:
		z_step    = 100 mm
		base_z_mm = -250 mm
		...
		b3:  +50 .. +149
		b2:  -50 ..  +49
		b1: -150 ..  -51
		b0: -250 .. -151
		With z_step = 100mm, uint64_t ranges 6.4m.
	

	int32_t  base_z_mm; // Reference Z level, bit0 spans  [base_z_mm...base_z_mm+z_step[
	uint64_t voxmap[MAP_PAGE_W*MAP_PAGE_W];
	map_unit_meta_t meta[(MAP_PAGE_W/2)*(MAP_PAGE_W/2)]; // half*half resolution

	Routing pages (for optimization purposes only) use single bits to denote forbidden areas, so
	that 32-bit wide robot shapes can be compared against hits efficiently. For the same reason,
	one extra uint32 block is included on the bottom (positive) end.

	uint8_t  routing_valid;
	uint32_t routing[MAP_PAGE_W][MAP_PAGE_W/32 + 1];

} map_page_t;

*/
const Config = require('./config.json');

const Jimp = require('jimp');

const MAP_CONSTANTS = require('./MapConstants');

const constraintsHeight = Config.constraintsHeight;

class BinaryToPng {
  constructor(binary) {
    this.data = binary;
    this.imageData = null;


    const VOXMAP_ALPHA = 255;

    this.colors = [
      /* 0       */ Jimp.rgbaToInt(220, 50, 220, VOXMAP_ALPHA), // rgba(220,50,220, 1), 
      /* 1       */ Jimp.rgbaToInt(140, 50, 220, VOXMAP_ALPHA), // rgba(140, 50, 220, 1)
      /* 2       */ Jimp.rgbaToInt(100, 120, 220, VOXMAP_ALPHA),// rgba(100, 120, 220, 1)
      /* 3       */ Jimp.rgbaToInt(20, 100, 240, VOXMAP_ALPHA), // rgba(20, 100, 240, 1)
      /* 4       */ Jimp.rgbaToInt(0, 130, 200, VOXMAP_ALPHA),  // rgba(0, 130, 200, 1)
      /* 5       */ Jimp.rgbaToInt(0, 160, 160, VOXMAP_ALPHA),  // rgba(0, 160, 160, 1)
      /* 6       */ Jimp.rgbaToInt(0, 200, 130, VOXMAP_ALPHA),  // rgba(0, 200, 130, 1)
      /* 7       */ Jimp.rgbaToInt(0, 220, 70, VOXMAP_ALPHA),   // rgba(0, 220, 70, 1)
      /* 8       */ Jimp.rgbaToInt(0, 250, 0, VOXMAP_ALPHA),    // rgba(0, 250, 0, 1)
      /* 9       */ Jimp.rgbaToInt(50, 220, 0, VOXMAP_ALPHA),   // rgba(50, 220, 0, 1)
      /* 10      */ Jimp.rgbaToInt(90, 190, 0, VOXMAP_ALPHA),   // rgba(90, 190, 0, 1)
      /* 11      */ Jimp.rgbaToInt(120, 150, 0, VOXMAP_ALPHA),  // rgba(120, 150, 0, 1)
      /* 12      */ Jimp.rgbaToInt(150, 120, 0, VOXMAP_ALPHA),  // rgba(150, 120, 0, 1)
      /* 13      */ Jimp.rgbaToInt(190, 90, 0, VOXMAP_ALPHA),   // rgba(190, 90, 0, 1)
      /* 14      */ Jimp.rgbaToInt(220, 50, 0, VOXMAP_ALPHA),   // rgba(220, 50, 0, 1)
      /* 15      */ Jimp.rgbaToInt(250, 0, 0, VOXMAP_ALPHA)     // rgba(250, 0, 0, 1)
    ];

    this.color1 = Jimp.cssColorToHex('#000000');
    this.color0 = Jimp.cssColorToHex('#f4f067');
    
    this.voxmapBlankColor = Jimp.cssColorToHex('#bebebe'); //Jimp.rgbaToInt(0, 0, 0, 50);
    this.forbiddenColor = Jimp.rgbaToInt(255, 190, 190, VOXMAP_ALPHA);

  }

  generateImageToFile(src, src2, mapPageId, notifyCB, constraintsCB = null) {

    try {

      ////// Constraints
      let mapPageConstraints = new Array(MAP_CONSTANTS.MAP_DIM);
      /*for (let i = 0; i < mapPageConstraints.length; ++i) {
        mapPageConstraints[i] = new Array(MAP_CONSTANTS.MAP_DIM);
      }*/
      mapPageConstraints = [...Array(MAP_CONSTANTS.MAP_DIM)].map(x => Array(MAP_CONSTANTS.MAP_DIM).fill(0));
      this.constraintsImageData = [...Array(MAP_CONSTANTS.MAP_DIM)].map(x => Array(MAP_CONSTANTS.MAP_DIM).fill(0));
      //////

      this.imageData = [...Array(MAP_CONSTANTS.MAP_DIM)].map(x => Array(MAP_CONSTANTS.MAP_DIM).fill(0));

      console.log('this.data.length', this.data.length);

      const uint8Array = new Uint8Array(this.data);


      let aByte, bByte, byteStr, numVisited;


      const int32Array = Int32Array.from(uint8Array);

      // Check if 64 bit map data or 32 map data
      let K = int32Array.length === MAP_CONSTANTS.FILE_SIZE_NEW_MAP_64 ? 8 : 4;

      const baseLevel = int32Array[0];
      console.log('baseLevel', baseLevel);

      let posStart = 4;
      let posEnd = posStart + K * MAP_CONSTANTS.MAP_DIM * MAP_CONSTANTS.MAP_DIM; // (8 bits or) 4 bits * 256 * 256
      const voxelData = uint8Array.slice(posStart, posEnd);
      console.log('voxelData', voxelData.length);

      posStart = posEnd;
      posEnd = posStart + 4 * 128 * 128; // 32 bits * 128 * 128
      const metadata = uint8Array.slice(posStart, posEnd);
      console.log('metadata', metadata.length);

      posStart = posEnd;
      posEnd = posStart + 1; // 8 bits
      const routingValid = uint8Array.slice(posStart, posEnd);
      console.log('routingValid', routingValid.length);

      posStart = posEnd;
      posEnd = posStart + 4 * MAP_CONSTANTS.MAP_DIM * (MAP_CONSTANTS.MAP_DIM / 32 + 1); // 32 bits * 256 * 256
      const routing = uint8Array.slice(posStart, posEnd);
      console.log('routing', routing.length);

      let i = 0, y = 0, x = 0;
      for (i = 0; i < voxelData.length; i += K) {

        // Check for rows
        if (x === MAP_CONSTANTS.MAP_DIM) {
          x = 0;
          ++y;
        }

        /////// Constraints
        mapPageConstraints[y][x] = 0;
        this.constraintsImageData[y][x] = this.color0;
        /////// Constraints

        this.imageData[y][x] = this.voxmapBlankColor;
        aByte = voxelData[i];
        byteStr = aByte.toString(2);
        for (let slice = 0; slice < byteStr.length; slice++) {
          if (aByte & (1 << slice)) {
            this.imageData[y][x] = this.colors[slice];

            /////// Constraints
            if (slice > constraintsHeight) {
              mapPageConstraints[y][x] = 1;
              this.constraintsImageData[y][x] = this.color1;
            }
            /////// Constraints
          }
        }

        bByte = voxelData[i + 1];
        byteStr = bByte.toString(2);
        for (let slice = 0; slice < byteStr.length; slice++) {
          if (bByte & (1 << slice)) {
            this.imageData[y][x] = this.colors[8 + slice];

            /////// Constraints
            if (8 + slice > constraintsHeight) {
              mapPageConstraints[y][x] = 1;
              this.constraintsImageData[y][x] = this.color1;
            }
            /////// Constraints
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



      this.writePngFile(src, this.imageData, mapPageId, notifyCB);
      this.writePngFile(src2, this.constraintsImageData, mapPageId);

      ////// Constraints
      if (constraintsCB) {
        try {
          constraintsCB(mapPageConstraints, mapPageId);
        } catch (error) {
          console.error(error);
        }
      }
      //////

    } catch (error) {
      console.error(error);
    }
  }


  writePngFile(src, data, mapPageId, notifyCB=null) {
    console.log('Writing img', mapPageId);
    const that = this;

    new Jimp(MAP_CONSTANTS.MAP_DIM, MAP_CONSTANTS.MAP_DIM, 0xFFFFFFFF, function (err, image) {
      try {
        if (err) throw err;
        
        data.forEach((row, y) => {
          row.forEach((color, x) => {
            image
            .setPixelColor(color, x, y);
          });
        });

        image.write(src, (err) => {
          if (err) throw err;
          
          if (notifyCB) {
            notifyCB(mapPageId);
          }
        });

      } catch (error) {
        console.error(error);
      }
    });
  }


};





module.exports = BinaryToPng;

/*
const o = new BinaryToImage(imageData);
o.generateImageToFile('juu.png');
*/