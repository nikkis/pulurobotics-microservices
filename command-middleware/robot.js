/**
* Data structures to represent robot
*/

const Msg = require("./binmsg.js");

const robot = {
    x: null,
    y: null,
    size_x: null,
    size_y: null,
    angle: null,
    status: null,
    motors_on: null,
    autonomous_exploration: null,
    battery: {
	charging: null,
	charge_finished: null,
	voltage: null,
	percentage: null,
	charge_voltage: null,
    },
    lidar: {
	offset_x: null,
	offset_y: null,
    },

    getStatus: () => {
	return {
	    x: robot.x,
	    y: robot.y,
	    size_x: robot.size_x,
	    size_y: robot.size_y,
	    angle: robot.angle,
	    status: robot.status,
	    motors_on: robot.motors_on,
	    autonomous_exploration: robot.autonomous_exploration,
	    battery: robot.battery,
	    lidar: robot.lidar,
	};
    },
    
    processMessage: (message) => {
	console.log(`Robot: processMessage(${message.type})`);

	var return_message = undefined;
	var payload = null;

	switch(message.type) {
	case Msg.TYPE_LIDAR_LOWRES:
	    robot.x = message.robot_x;
	    robot.y = message.robot_y;
	    robot.angle = message.robot_angle;

	    if (message.lidar_points.length > 0) {
		// TODO: handle lidar points
	    }

	    return_message = "lidar_lowres";
	    payload = robot.getStatus();
	    break;
	case Msg.TYPE_DBG:
	    return_message = "debug";
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
	    payload = {
		start: {
		    x: message.route_start_x,
		    y: message.route_start_y,
		},
		points: message.route_points,
	    };
	    break;
	case Msg.TYPE_SYNCREQ:
	    return_message = "sync_request";
	    break;
	case Msg.TYPE_DBGPOINT:
	    return_message = "dbgpoint";
	    break;
	case Msg.TYPE_HMAP:
	    robot.angle = message.robot_angle;
	    robot.x = message.robot_x;
	    robot.y = message.robot_y;
	    return_message = "robot_status";
	    payload = robot.getStatus();
	    break;
	case Msg.TYPE_INFOSTATE:
	    robot.status = message.info_state;
	    return_message = "robot_status";
	    payload = robot.getStatus();
	    break;
	case Msg.TYPE_ROBOTINFO:
	    robot.size_x = message.robot_size_x;
	    robot.size_y = message.robot_size_y;
	    robot.lidar.offset_x = message.lidar_offset_x;
	    robot.lidar.offset_y = message.lidar_offset_y;
	    return_message = "robot_status";
	    payload = robot.getStatus();
	    break;
	case Msg.LIDAR_HIGHRES:
	    return_message = "lidar_highres";
	    break;
	case Msg.TYPE_PICTURE:
	    return_message = "picture";
	    break;
	case Msg.TYPE_MOVEMENT_STATUS:
	    return_message = "movement_status";
	    payload = {
		start: {
		    x: message.start_x,
		    y: message.start_y,
		    angle: message.start_angle,
		},
		requested: {
		    x: message.requested_x,
		    y: message.requested_y,
		    backmode: message.requested_backmode,
		},
		current: {
		    x: message.current_x,
		    y: message.current_y,
		    angle: message.current_angle,
		},
		statuscode: message.statuscode,
		success: message.success,
		hardware_obstacle_flags: message.hardware_obstacle_flags,
	    };
	    break;
	case Msg.TYPE_ROUTE_STATUS:
	    return_message = "route_status";
	    payload = {
		start: {
		    x: message.start_x,
		    y: message.start_y,
		    angle: message.start_angle,
		},
		requested: {
		    x: message.requested_x,
		    y: message.requested_y,
		},
		current: {
		    x: message.current_x,
		    y: message.current_y,
		    angle: message.current_angle,
		},
		statuscode: message.statuscode,
		success: message.success,
		reroute_count: message.reroute_count,
	    };
	    break;
	case Msg.STATEVECT:
	    robot.motors_on = message.motors_on;
	    robot.autononmous_exploration = message.autonomous_exploration;
	    return_message = "robot_status";
	    payload = robot.getStatus();
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

    createStartMappingCommand: () => {
	return Msg.encodeMessage(58, "i", 3);
    },
}

module.exports = robot;
