/**
* Data structures to represent robot
*/

const Msg = require("./binmsg.js");

const robot = {
    x: undefined,
    y: undefined,

    getStatus: () => {
	return {
	    x: robot.x,
	    y: robot.y
	};
    },
    
    processMessage: (message) => {
	console.log("Robot: processMessage()");

	var return_message = undefined;
	var payload = null;

	switch(message.type) {
	case Msg.TYPE_LIDAR_LOWRES:
	    return_message = "lidar_lowres";
	    break;
	case Msg.TYPE_DBG:
	    return_message = "debug";
	    payload = {foo: "bar"};
	    break;
	case Msg.TYPE_SONAR:
	    return_message = "sonar";
	    break;
	case Msg.TYPE_BATTERY:
	    return_message = "battery";
	    break;
	case Msg.TYPE_ROUTEINFO:
	    return_message = "routeinfo";
	    break;
	case Msg.TYPE_SYNCREQ:
	    return_message = "sync_request";
	    break;
	case Msg.TYPE_DBGPOINT:
	    return_message = "dbgpoint";
	    break;
	case Msg.TYPE_HMAP:
	    return_message = "hmap";
	    break;
	case Msg.TYPE_INFOSTATE:
	    return_message = "infostate";
	    break;
	case Msg.TYPE_ROBOTINFO:
	    return_message = "robotinfo";
	    break;
	case Msg.LIDAR_HIGHRES:
	    return_message = "lidar_highres";
	    break;
	case Msg.TYPE_PICTURE:
	    return_message = "picture";
	    break;
	case Msg.TYPE_MOVEMENT_STATUS:
	    return_message = "movement_status";
	    break;
	case Msg.TYPE_ROUTE_STATUS:
	    return_message = "route_status";
	    break;
	case Msg.STATEVECT:
	    return_message = "state_vector";
	    break;
	case Msg.LOCALIZATION_RESULT:
	    return_message = "localization_result";
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
