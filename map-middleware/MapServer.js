const Config = require('./config.json');

const BinaryToPng = require('./BinaryToPng');
const CleaningPathFinder = require('./CleaningPathFinder');

const fs = require('fs');
const path = require('path');

const MAP_FILE_PNG_EXTENSION = '.png';
const MAP_FILE_CONSTRAINTS_EXTENSION = '.constraints.png';
const MAP_FILE_EXTENSION = '.map';
const MAP_PNG_DIR = 'images/';
const MAP_DATA_DIR = Config.mapDataFilePath; //'data/';

const MAP_CONSTANTS = require('./MapConstants');

/**
 * Gets as parameter @filePath where map files are/will be located, and observes their changes. 
 */
class MapServer {

  constructor(io) {

    // If Config.autoDetect: true, MapServer will automatically 
    // detect map format and update some of these UI init data
    this.initDataForClient = {
      mapDataFormat: MAP_CONSTANTS.MAP_FORMATS[MAP_CONSTANTS.MAP_DEFAULT_FORMAT],
      numOfMapPages: MAP_CONSTANTS.MAP_PAGE_SIZE
    };
    
    this.io = io;

    this.filePath = Config.mapDataFilePath;
    console.log('Map file path ' + this.filePath);

    // key: map page id, value: png-filename
    this.currentMapFiles = {};

    /*
    // Delete old data
    if (!fs.existsSync(MAP_DATA_DIR)) {
      fs.mkdirSync(MAP_DATA_DIR);
    }
    fs.readdir(MAP_DATA_DIR, (err, files) => {
      if (err) throw err;
      for (const file of files) {
        fs.unlink(path.join(MAP_DATA_DIR, file), err => {
          if (err) throw err;
        });
      }
    });
    */


    // Delete old png map files
    if (!fs.existsSync(MAP_PNG_DIR)) {
      fs.mkdirSync(MAP_PNG_DIR);
    }
    fs.readdir(MAP_PNG_DIR, (err, files) => {
      if (err) throw err;
      for (const file of files) {
        fs.unlink(path.join(MAP_PNG_DIR, file), err => {
          if (err) throw err;
        });
      }
    });


    // Observe for new or changed files
    this.mapPagePngsGenerated = {};

    const that = this;
    const handleFile = (filename) => {

      if (filename && filename.includes(MAP_FILE_EXTENSION)) {

        if (fs.existsSync(this.filePath + filename)) {

          ////////////////////////////
          if (Config.updateInterval !== -1) {
            const minWaitTime = 1000 * Config.updateInterval;
            if (this.mapPagePngsGenerated && this.mapPagePngsGenerated[filename]) {
              if (Date.now() - this.mapPagePngsGenerated[filename] < minWaitTime) {
                console.log('Blocked by Setting: Config.updateInterval', Config.updateInterval);
                return;
              }
            }
          }
          ////////////////////////////
          const mapPageId = that.getPageIDFromFilename(filename);

          //fs.copyFileSync(this.filePath + filename, MAP_DATA_DIR + filename);
          const stats = fs.statSync(Config.mapDataFilePath + filename);
          
          const fileSizeInBytes = stats.size;

          if (!MAP_CONSTANTS.FILE_SIZES.includes(fileSizeInBytes)) {
            console.log('INVALID MAP FILE (wrong size):', mapPageId);
            return;
          }

          if(Config.autoDetect) {
            this.initDataForClient.mapDataFormat = MAP_CONSTANTS.MAP_FORMATS[fileSizeInBytes];
          }

          that.currentMapFiles[filename] = that.getPngFromBinaryFile(filename, mapPageId);
          this.mapPagePngsGenerated[filename] = Date.now();

        } else {
          console.log('File does not exist (yet?)', filename);
        }
      }
    };


    // Get current map files
    fs.readdir(this.filePath, (err, files) => {
      try {
        let mapBinaryFilenames = files.filter(function (el) {
          return el.toLowerCase().indexOf(MAP_FILE_EXTENSION.toLowerCase()) > -1;
        });

        for (let index = 0; index < mapBinaryFilenames.length; index++) {
          const filename = mapBinaryFilenames[index];
          handleFile(filename, this.mapFilePngReadyCallback);
        }

      } catch (error) {
        console.error(error);
      }
    });

    fs.watch(this.filePath, {
      persistent: true
    }, (event, filename) => { handleFile(filename, this.mapFilePngReadyCallback) });


    // Path finder
    try {
      this.pathFinder = new CleaningPathFinder();
    } catch (error) {
      console.error(error);
    }
  }


  getAllMapFiles(req, res) {
    try {
      console.log('Getting list of files');
      let files = [];

      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
      res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
      res.setHeader('Cache-Control', 'no-cache');

      fs.readdir(MAP_PNG_DIR, (err, files) => {
        try {
          files = files.filter(function (el) {
            return el.toLowerCase().indexOf('.png'.toLowerCase()) > -1;
          });
        } catch (error) {
          console.error(error);
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end("Dir " + this.filePath + " not found!");
          return;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });



        let mapPages = [];
        for (let index = 0; index < files.length; index++) {
          const filename = files[index];
          const mapPageId = this.getPageIDFromFilename(filename);
          mapPages.push(this.mapPageData(mapPageId));
        }

        let returnData = { 
          initData: this.initDataForClient,
          mapPages 
        };
        res.end(JSON.stringify(returnData, null, 2));
        return;
      });

    } catch (error) {
      console.error(error);
      res.statusCode = 500;
      res.end(`Error getting the file: ${error}.`);
      return;
    }

  }

  getMapPageImage(req, res) {
    try {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
      res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
      //res.setHeader('Cache-Control', 'no-cache');
      res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
      res.header('Expires', '-1');
      res.header('Pragma', 'no-cache');


      const pathname = MAP_PNG_DIR + this.getFilenameFromPageID(req.params.mapPageId);

      fs.exists(pathname, function (exist) {
        if (!exist) {
          // if the file is not found, return 404
          res.statusCode = 404;
          res.end(`File ${pathname} not found!`);
          return;
        }

        fs.readFile(pathname, function (err, data) {
          if (err) {
            res.statusCode = 500;
            res.end(`Error getting the file: ${err}.`);
          } else {
            // if the file is found, set Content-type and send data
            res.setHeader('Content-type', 'image/png');
            res.end(data);
            return;
          }
        });
      });
    } catch (error) {
      console.error(error);
      res.statusCode = 500;
      res.end(`Error getting the file: ${error}.`);
      return;
    }

  }


  /**
   * Method is called when generating the png file is ready
   */
  mapFilePngReadyCallback(mapPageId) {
    console.log('MAP png ready', mapPageId);
    try {
      // Send to all instead of just one
      this.io.sockets.emit('map_page_changed', this.mapPageData(mapPageId));
      console.log('sent!');
    } catch (error) {
      console.error(error);
    }
  }


  ///// Internal
  /**
   * Gets ids of all detected map files
   */
  getAllMapFileIDs() {
    return this.currentMapFiles;
  }

  mapPageData(mapPageId) {
    return {
      mapPageId: mapPageId,
      resource: 'images/' + mapPageId + MAP_FILE_EXTENSION + MAP_FILE_PNG_EXTENSION,
      resource2: 'images/' + mapPageId + MAP_FILE_EXTENSION + MAP_FILE_CONSTRAINTS_EXTENSION,
      timestamp: Date.now()
    };
  }

  getPngFromBinaryFile(fileName, mapPageId) {
    try {

      const pngFileName = MAP_PNG_DIR + fileName + MAP_FILE_PNG_EXTENSION;
      const pngFileName2 = MAP_PNG_DIR + fileName + MAP_FILE_CONSTRAINTS_EXTENSION;
      //const fullPath = Config.mapDataFilePath + fileName;
      
      const fullPath = MAP_DATA_DIR + fileName;

      const notifyCB = (mapPageId) => {
        this.mapFilePngReadyCallback(mapPageId);
      };

      const constraintsCB = (constraints, mapPageId) => {
        this.setMapPageConstraintsCB(constraints, mapPageId);
      }

      fs.readFile(fullPath, null, function (err, data) {
        try {

          if (err) throw err;

          const binaryToPng = new BinaryToPng(data.buffer);
          binaryToPng.generateImageToFile(pngFileName, pngFileName2, mapPageId, notifyCB, constraintsCB);
        } catch (error) {
          console.error(error);
        }
      });

      return pngFileName;
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  getFilenameFromPageID(mapPageID) {
    return mapPageID + MAP_FILE_PNG_EXTENSION;
  }

  getPageIDFromFilename(filename) {
    let mapPageID = filename.split('.map')[0];
    return mapPageID;
  }



  //// Cleaning Path finder

  /**
   * HTTP GET to get cleaning path from the cleaning pathfinder
   * @param startX and @param startY given as query parameters
   */
  getCleaningPath(req, res) {
    try {
      console.log('Getting cleaning path from path finder');
      
      let coordinates;
      if(req.query.startX && req.query.startY) {
        coordinates = {
          x: parseInt(req.query.startX),
          y: parseInt(req.query.startY)
        };
        console.log(coordinates);
      } else {
        throw 'Give both startX and startY as query parameters';
      }

      const createTestPng = req.query.testPng ? true : false;
      const randomMode = req.query.mode && req.query.mode === 'random' ? true : false;
      
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
      res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
      res.setHeader('Cache-Control', 'no-cache');
      
      if(this.pathFinder) {
        
        let cleaningPath = this.pathFinder.getPath(coordinates, randomMode, createTestPng);

        let returnData = { cleaningPath };
  
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(returnData, null, 2));
        return;

      } else {
        throw 'No cleaning path finder';
      }
      

    } catch (error) {
      console.error(error);
      res.statusCode = 500;
      res.end(`Error getting the cleaning path: ${error}.`);
      return;
    }
  }

  /**
   * Method is called when map png image has been created
   * @param mapPageConstraints two-dimensional array
   * 
   */
  setMapPageConstraintsCB(mapPageConstraints, mapPageId) {
    try {
      this.pathFinder.setMapPageConstraints(mapPageConstraints, mapPageId);
    } catch (error) {
      console.error(error);
    }
  }






}


module.exports = MapServer;