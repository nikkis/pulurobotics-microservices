
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

const CONSTRAINT_FORBIDDEN = (1 << 0);

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
    this.visitedColor = Jimp.rgbaToInt(255, 255, 255, VOXMAP_ALPHA);

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

      const newVoxelData = [];
      const newMetadata = [];
      let i = 0, y = 0, x = 0;
      for (i = 0; i < voxelData.length; i += K) {

        // Check for rows
        if (x === MAP_CONSTANTS.MAP_DIM) {
          x = 0;
          ++y;
        }


        aByte = voxelData[i];
        bByte = voxelData[i + 1];
        newVoxelData.push({ aByte, bByte });

        x++;
      }


      for (let i2 = 0; i2 < metadata.length; i2 += 4) {
        newMetadata.push({
          timestamp: metadata[i2],
          constraints: metadata[i2 + 1],
          numVisited: metadata[i2 + 2],
          reserved: metadata[i2 + 3]
        });
      }

      console.log('newMetadata', newMetadata.length);


      const cur_slice = 8;
      const MAP_PAGE_W = MAP_CONSTANTS.MAP_DIM;
      let tempImgPixels = new Array(MAP_PAGE_W * MAP_PAGE_W);
      let tempImgPixels2 = new Array(MAP_PAGE_W * MAP_PAGE_W);
      let mapPageConstraintsTemp = new Array(MAP_PAGE_W * MAP_PAGE_W);
      for (let xInd = 0; xInd < MAP_PAGE_W; xInd++) {
        for (let yInd = 0; yInd < MAP_PAGE_W; yInd++) {

          /////// Constraints
          tempImgPixels[(MAP_PAGE_W - 1 - yInd) * MAP_PAGE_W + xInd] = this.voxmapBlankColor;
          tempImgPixels2[(MAP_PAGE_W - 1 - yInd) * MAP_PAGE_W + xInd] = this.color0;
          mapPageConstraintsTemp[(MAP_PAGE_W - 1 - yInd) * MAP_PAGE_W + xInd] = 0;
          /////// Constraints

          if (false) { //page -> meta[(y / 2) * (MAP_PAGE_W / 2) + (x / 2)].constraints & CONSTRAINT_FORBIDDEN) {
            //pixels[(MAP_PAGE_W - 1 - y) * MAP_PAGE_W + x] = this.forbiddenColor;
          }
          else {

            const val = newVoxelData[yInd * MAP_PAGE_W + xInd];

            for (let slice = 0; slice < val.aByte.toString(2).length; slice++) {
              //for (let slice = 0; slice < cur_slice; slice++) {
              if (val.aByte & (1 << slice)) {
                tempImgPixels[(MAP_PAGE_W - 1 - yInd) * MAP_PAGE_W + xInd] = this.colors[slice];
                if (slice > constraintsHeight) {
                  mapPageConstraintsTemp[(MAP_PAGE_W - 1 - yInd) * MAP_PAGE_W + xInd] = 1;
                  tempImgPixels2[(MAP_PAGE_W - 1 - yInd) * MAP_PAGE_W + xInd] = this.color1;
                }
              }
            }
            for (let slice = 0; slice < val.bByte.toString(2).length; slice++) {
              //for (let slice = 0; slice < cur_slice; slice++) {
              if (val.bByte & (1 << slice)) {
                tempImgPixels[(MAP_PAGE_W - 1 - yInd) * MAP_PAGE_W + xInd] = this.colors[8 + slice];
                if (8 + slice > constraintsHeight) {
                  mapPageConstraintsTemp[(MAP_PAGE_W - 1 - yInd) * MAP_PAGE_W + xInd] = 1;
                  tempImgPixels2[(MAP_PAGE_W - 1 - yInd) * MAP_PAGE_W + xInd] = this.color1;
                }
              }
            }

            
            if ((((yInd & 1) && (xInd & 1)))) {
              //console.log('WUUU', newMetadata[(yInd / 2) * (MAP_PAGE_W / 2) + (xInd / 2)]);
              if (newMetadata[(yInd / 2) * (MAP_PAGE_W / 2) + (xInd / 2)]) {// &&
                //newMetadata[(yInd / 2) * (MAP_PAGE_W / 2) + (xInd / 2)].constraints & CONSTRAINT_FORBIDDEN) {
                console.log('JUUUUU UU ------------------------ ---- - ');
                tempImgPixels[(MAP_PAGE_W - 1 - yInd) * MAP_PAGE_W + xInd] = this.forbiddenColor;
              }

              if (newMetadata[(yInd / 2) * (MAP_PAGE_W / 2) + (xInd / 2)] &&
                newMetadata[(yInd / 2) * (MAP_PAGE_W / 2) + (xInd / 2)].numVisited > 0) {
                  console.log('JUUUUU UU 2 ------------------------ ---- - ');
                tempImgPixels[(MAP_PAGE_W - 1 - yInd) * MAP_PAGE_W + xInd] = this.visitedColor;
              }
            }


          }

        }
      }

      const newImageData = [...Array(MAP_CONSTANTS.MAP_DIM)].map(x => Array(MAP_CONSTANTS.MAP_DIM).fill(0));
      const newImageData2 = [...Array(MAP_CONSTANTS.MAP_DIM)].map(x => Array(MAP_CONSTANTS.MAP_DIM).fill(0));

      let yy = 0, xx = 0;
      for (let i = 0; i < tempImgPixels.length; i++) {
        // Check for rows
        if (xx === MAP_CONSTANTS.MAP_DIM) {
          xx = 0;
          ++yy;
        }
        //mapPageConstraints[yy][xx] = mapPageConstraintsTemp[i];
        newImageData[yy][xx] = tempImgPixels[i];
        newImageData2[yy][xx] = tempImgPixels2[i];
        ++xx;
      }

      yy = MAP_CONSTANTS.MAP_DIM - 1, xx = 0;
      for (let i = 0; i < tempImgPixels.length; i++) {
        // Check for rows
        if (xx === MAP_CONSTANTS.MAP_DIM) {
          xx = 0;
          --yy;
        }

        mapPageConstraints[yy][xx] = mapPageConstraintsTemp[i];
        ++xx;
      }

      this.writePngFile(src, newImageData, mapPageId, notifyCB);
      this.writePngFile(src2, newImageData2, mapPageId);
      //this.writePngFile(src2, this.constraintsImageData, mapPageId);

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


  writePngFile(src, data, mapPageId, notifyCB = null) {
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