/**
* Data structures to represent robot
*/

const Msg = require("./binmsg.js");

const robot = {
    // public fields
    x: null,
    y: null,
    size_x: null,
    size_y: null,
    angle: null,
    status: null,
    motors_on: null,
    vacuum_on: null,
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

    // private fields
    waypoints: undefined,
    localization_2d: undefined,
    localization_3d: undefined,
    mapping_2d: undefined,
    mapping_3d: undefined,
    collision_mapping: undefined,
    big_localization_area: undefined,
    reserved3: undefined,
    reserved4: undefined,
    reserved5: undefined,
    reserved6: undefined,
    reserved7: undefined,
    reserved8: undefined,
    reserved9: undefined,

    // public methods
    getStatus: () => {
	return {
	    x: robot.x,
	    y: robot.y,
	    size_x: robot.size_x,
	    size_y: robot.size_y,
	    angle: robot.angle,
	    status: robot.status,
	    motors_on: robot.motors_on,
	    vacuum_on: robot.vacuum_on,
	    autonomous_exploration: robot.autonomous_exploration,
	    battery: robot.battery,
	    lidar: robot.lidar,
	};
    },
    
    processMessage: (message) => {
	//console.log(`Robot: processMessage(${message.type})`);

	var return_message = undefined;
	var payload = null;

	switch(message.type) {
	case Msg.TYPE_VOXEL_MAP:
	    // TODO: implement if needed
	    break;
	case Msg.TYPE_PWR_STATUS:
	    robot.battery.charging = message.charging == 0 ? false : true;
	    robot.battery.charge_finished = message.charge_finished == 0 ? false : true;
	    robot.battery.voltage = message.battery_voltage;
	    robot.battery.percentage = message.battery_percentage;
	    robot.battery.charge_voltage = message.charge_voltage;
	    return_message = "robot_status";
	    payload = robot.getStatus();
	    break;
	case Msg.TYPE_TOF_DIAGNOSTICS:
	    // TODO: implement if needed
	    break;
	case Msg.TYPE_HW_POSE:
	    robot.x = message.robot_x;
	    robot.y = message.robot_y;
	    robot.angle = message.robot_angle;

	    return_message = "robot_status";
	    payload = robot.getStatus();
	    break;
	case Msg.TYPE_DRIVE_DIAGNOSTICS:
	    // TODO: implement if needed
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

	    if (robot.waypoints && robot.waypoints.length > 0) {
		console.debug("Result from previous waypoint:", message.success);
		const waypoint = robot.waypoints.shift();
		console.debug("Proceeding to next waypoint:", waypoint);
		const cmd = Msg.encodeMessage(Msg.TYPE_ROUTE, "iiB", waypoint.x, waypoint.y, 0);
		robot.socket.write(cmd);
	    }
	    break;
	case Msg.TYPE_STATEVECT:
	    robot.localization_2d = message.localization_2d;
	    robot.localization_3d = message.localization_3d;
	    robot.mapping_2d = message.mapping_2d;
	    robot.mapping_3d = message.mapping_3d;
	    robot.collision_mapping = message.collision_mapping;
	    robot.motors_on = message.motors_on;
	    robot.autononmous_exploration = message.autonomous_exploration;
	    robot.big_localization_area = message.big_localization_area;
	    robot.vacuum_on = message.vacuum_app;
	    robot.reserved3 = message.reserved3;
	    robot.reserved4 = message.reserved4;
	    robot.reserved5 = message.reserved5;
	    robot.reserved6 = message.reserved6;
	    robot.reserved7 = message.reserved7;
	    robot.reserved8 = message.reserved8;
	    robot.reserved9 = message.reserved9;
	    return_message = "robot_status";
	    payload = robot.getStatus();
	    break;
	case Msg.TYPE_LOCALIZATION_RESULT:
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

    // private methods
}

module.exports = robot;
