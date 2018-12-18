/**
* Data structures to represent robot
*/

const Msg = require("./binmsg.js");

const robot = {
    x: undefined,
    y: undefined,

    processMessage: (message) => {
	console.log("Robot: processMessage()");

	var return_message = undefined;
	var payload = null;

	switch(message.type) {
	case Msg.TYPE_LIDAR_LOWRES:
	    return_message = "lidar lowres";
	    console.log(return_message);
	    break;
	case Msg.TYPE_DBG:
	    return_message = "debug";
	    console.log(return_message);
	    payload = {foo: "bar"};
	    break;
	case Msg.TYPE_SONAR:
	    return_message = "sonar";
	    console.log(return_message);
	    break;
	case Msg.TYPE_BATTERY:
	    return_message = "battery";
	    console.log(return_message);
	    break;
	case Msg.TYPE_ROUTEINFO:
	    return_message = "routeinfo";
	    console.log(return_message);
	    break;
	case Msg.TYPE_SYNCREQ:
	    return_message = "sync request";
	    console.log(return_message);
	    break;
	case Msg.TYPE_DBGPOINT:
	    return_message = "dbgpoint";
	    console.log(return_message);
	    break;
	case Msg.TYPE_HMAP:
	    return_message = "hmap";
	    console.log(return_message);
	    break;
	case Msg.TYPE_INFOSTATE:
	    return_message = "infostate";
	    console.log(return_message);
	    break;
	case Msg.TYPE_ROBOTINFO:
	    return_message = "robotinfo";
	    console.log(return_message);
	    break;
	case Msg.LIDAR_HIGHRES:
	    return_message = "lidar highres";
	    console.log(return_message);
	    break;
	case Msg.TYPE_PICTURE:
	    return_message = "picture";
	    console.log(return_message);
	    break;
	case Msg.TYPE_MOVEMENT_STATUS:
	    return_message = "movement status";
	    console.log(return_message);
	    break;
	case Msg.TYPE_ROUTE_STATUS:
	    return_message = "route status";
	    console.log(return_message);
	    break;
	case Msg.STATEVECT:
	    return_message = "state vector";
	    console.log(return_message);
	    break;
	case Msg.LOCALIZATION_RESULT:
	    return_message = "localization result";
	    console.log(return_message);
	    break;
	default:
	    console.log(`Robot: Unknown message type ${message.type}`);
	}

	return {
	    return_message: return_message,
	    payload: payload
	};
    },
}

module.exports = robot;
