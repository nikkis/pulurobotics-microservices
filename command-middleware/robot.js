/**
* Data structures to represent robot
*/

const Msg = require("./binmsg.js");

const robot = {
    x: null,
    y: null,
    status: null,
    motors_on: null,
    autonomous_exploration: null,
    battery: {
	charging: null,
	charge_finished: null,
	voltage: null,
	percentage: null,
	chare_voltage: null,
    },

    getStatus: () => {
	return {
	    x: robot.x,
	    y: robot.y,
	    status: robot.status,
	    motors_on: robot.motors_on,
	    autonomous_exploration: robot.autonomous_exploration,
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
	    robot.battery.charging = message.charging == 0 ? false : true;
	    robot.battery.charge_finished = message.charge_finished == 0 ? false : true;
	    robot.battery.voltage = message.battery_voltage;
	    robot.battery.percentage = message.battery_percentage;
	    robot.battery.charge_voltage = message.charge_voltage;
	    return_message = "battery";
	    payload = robot.getStatus();
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
	    robot.status = message.info_state;
	    return_message = "robot_status";
	    payload = robot.getStatus();
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
	    robot.motors_on = message.motors_on;
	    robot.autononmous_exploration = message.autonomous_exploration;
	    payload = robot.getStatus();
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
