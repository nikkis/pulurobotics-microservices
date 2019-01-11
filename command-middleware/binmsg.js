/**
* messaging.js
*/

const assert = require("assert").strict;

// Public constants
const TYPE_DEST = 355;
const TYPE_ROUTE = 356;
const TYPE_CHARGE = 357;
const TYPE_MODE = 358;
const TYPE_MANU = 359;
const TYPE_ADDCONSTRAINT = 360;
const TYPE_REMCONSTRAINT = 361;

const TYPE_VOXEL_MAP = 1;
const TYPE_PWR_STATUS = 4;
const TYPE_TOF_DIAGNOSTICS = 8;
const TYPE_HW_POSE = 10;
const TYPE_DRIVE_DIAGNOSTICS = 11;
const TYPE_ROUTEINFO = 435;
const TYPE_SYNCREQ = 436;
const TYPE_INFOSTATE = 439;
const TYPE_ROBOTINFO = 440;
const TYPE_MOVEMENT_STATUS = 443;
const TYPE_ROUTE_STATUS = 444;
const TYPE_STATEVECT = 445;
const TYPE_LOCALIZATION_RESULT = 446;

// Private constants
const BIN_HEADER_LENGTH = 5;
const STATE_VECT_LENGTH = 16;

/**
* Encode a binary message.
* @opcode - The opcode of the message.
* @format - A string describing how to encode the data.
*  - b: signed char, 1 byte
*  - B: unsigned char, 1 byte.
*  - H: unsigned short, 2 bytes.
*  - i: signed integer, 4 bytes.
*  The encoding is always big-endian.
* @data {...*} - A variable number of arguments with the data.
* @returns A Buffer with the encoded message.
*/
function encodeMessage() {
    assert(arguments.length >= 1, "Must specify at least a message opcode");
    
    var opcode = arguments[0];

    assert(opcode != undefined, "Message opcode must be defined");

    if (arguments.length == 1) {
	// message without payload
	var buffer = Buffer.alloc(5);
	buffer.writeUIntBE(opcode, 0, 2);
	buffer.writeUIntBE(0, 2, 3);
	return buffer;
    }
    
    var format = arguments[1];

    assert(format.length == arguments.length - 2, "Number of format string items must match number of data arguments");
    
    // count the length of the data as per the format string
    var data_length = 0;
    for (var i = 0; i < format.length; i++) {
	switch (format[i]) {
	case "b":
	    data_length += 1;
	    break;
	case "B":
	    data_length += 1;
	    break;
	case "H":
	    data_length += 2;
	    break;
	case "i":
	    data_length += 4;
	    break;
	}
    }

    // construct the message
    var buffer = Buffer.alloc(BIN_HEADER_LENGTH + data_length);

    // construct header
    buffer.writeUIntBE(opcode, 0, 2);
    buffer.writeUIntBE(data_length, 2, 3);
    
    // loop through the remaining arguments and encode them
    var pos = 5; // first position to write data to
    for (var i = 0; i < format.length; i++) {
	var data = arguments[i+2]; // first 2 arguments already done

	switch(format[i]) {
	case "b":
	    buffer.writeIntBE(data, pos, 1);
	    pos += 1;
	    break;
	case "B":
	    buffer.writeUIntBE(data, pos, 1);
	    pos += 1;
	    break;
	case "H": // unsigned short, 2 bytes
	    buffer.writeUIntBE(data, pos, 2);
	    pos += 2;
	    break;
	case "i": // signed int, 4 bytes
	    buffer.writeIntBE(data, pos, 4);
	    pos += 4;
	    break;
	}
    }

    return buffer;
}

/**
* Decode a message.
* @param data - A buffer containing the message data.
* @returns An Object with the decoded message.
*/
function decodeMessage(msgdata) {
    assert(msgdata != undefined, "Must specify data");

    var opcode = msgdata.readUIntBE(0, 2);
    var length = msgdata.readUIntBE(2, 3);
    var data = msgdata.slice(5);

    var message = {
	type: opcode,
	length: length
    };

    switch(opcode) {
    case TYPE_VOXEL_MAP:
	message.running_count = data.readIntLE(0, 4);
	break;
    case TYPE_PWR_STATUS:
	//console.log("decoding TYPE_PWR_STATUS");
	message.charging = data.readIntBE(0, 1) & 1;
	message.charge_finished = data.readIntBE(0, 1) & 2;;
	message.battery_percentage = data.readIntBE(1, 1);
	message.battery_voltage = data.readIntBE(2, 2) / 1000.0;
	message.charge_voltage = data.readIntBE(4, 2) / 1000.0;
	break;
    case TYPE_TOF_DIAGNOSTICS:
	//console.log("decoding TYPE_TOF_DIAGNOSTICS");
	message.sensor_index = data.readUIntLE(0, 1);
	message.temperature = data.readUIntLE(0, 2);
	break;
    case TYPE_DRIVE_DIAGNOSTICS:
	message.remaining_distance = data.readUIntLE(28, 4);
	break;
    case TYPE_HW_POSE:
	//console.log("decoding TYPE_HW_POSE");
	message.robot_angle = data.readUIntLE(0, 4) / 11930464.711111;
	message.robot_pitch = data.readUIntLE(4, 4) / 11930464.711111;
	message.robot_roll = data.readUIntLE(8, 4) / 11930464.711111;
	message.robot_x = data.readIntLE(12, 4);
	message.robot_y = data.readIntLE(16, 4);
	message.robot_z = data.readIntLE(20, 4);
	break;
    case TYPE_ROUTEINFO:
	//console.log("decoding TYPE_ROUTEINFO");
	message.route_start_x = data.readIntBE(0, 4);
	message.route_start_y = data.readIntBE(4, 4);

	message.route_points = [];

	for (var i = 8; i < data.length; i += 9) {
	    var point = {};
	    point.backmode = data.readIntBE(i, 1);
	    point.x = data.readIntBE(i + 1, 4);
	    point.y = data.readIntBE(i + 5, 4);
	    message.route_points.push(point);
	}
	break;
    case TYPE_SYNCREQ:
	// This message has no payload
	break;
    case TYPE_INFOSTATE:
	//console.log("decoding TYPE_INFOSTATE");
	var info_state = data.readIntBE(0, 1);
	if (info_state == -1) {
	    message.info_state = "undefined";
	} else if (info_state == 0) {
	    message.info_state = "idle";
	} else if (info_state == 1) {
	    message.info_state = "think";
	} else if (info_state == 2) {
	    message.info_state = "forward";
	} else if (info_state == 3) {
	    message.info_state = "reverse";
	} else if (info_state == 4) {
	    message.info_state = "left";
	} else if (info_state == 5) {
	    message.info_state = "right";
	} else if (info_state == 6) {
	    message.info_state = "charging";
	} else if (info_state == 7) {
	    message.info_state = "daijuing";
	} else {
	    return undefined; // TODO: confirm that this is a good way to signal invalid data
	}
	break;
    case TYPE_ROBOTINFO:
	//console.log("decoding TYPE_ROBOTINFO");
	message.robot_size_x = data.readIntBE(0, 2);
	message.robot_size_y = data.readIntBE(2, 2);
	message.robot_origin_x = data.readIntBE(4, 2);
	message.robot_origin_y = data.readIntBE(6, 2);
	break;
    case TYPE_MOVEMENT_STATUS:
	//console.log("decoding TYPE_MOVEMENT_STATUS");
	
	message.start_angle = data.readUIntBE(0, 2);
	message.start_x = data.readIntBE(2, 4);
	message.start_y = data.readIntBE(6, 4);
	message.requested_x = data.readIntBE(10, 4);
	message.requested_y = data.readIntBE(14, 4);
	message.requested_backmode = data.readIntBE(18, 1);
	message.current_angle = data.readUIntBE(19, 2);
	message.current_x = data.readIntBE(21, 4);
	message.current_y = data.readIntBE(25, 4);
	message.statuscode = data.readIntBE(29, 1);
	if (message.statuscode == 0) {
	    message.success = true;
	} else {
	    message.success = false;
	}
	message.hardware_obstacle_flags = data.readIntBE(30, 4);
	break;
    case TYPE_ROUTE_STATUS:
	// TODO: check
	/* TODO: consider how to handle status code descriptions:
	   0: Success
	   1: Obstacles on map close to the beginning, can't get started
	   2: Got a good start thanks to backing off, but obstacles on the way later
	   3: Got a good start, but obstacles on the way later
	   4: Unknown (newly implemented?) reason
	   Or whether not to include them at all.
	*/
	//console.log(`Opcode ${opcode} not verified.`);

	message.start_angle = data.readUIntBE(0, 2);
	message.start_x = data.readIntBE(2, 4);
	message.start_y = data.readIntBE(6, 4);
	message.requested_x = data.readIntBE(10, 4);
	message.requested_y = data.readIntBE(14, 4);
	message.current_angle = data.readUIntBE(18, 2);
	message.current_x = data.readIntBE(20, 4);
	message.current_y = data.readIntBE(24, 4);
	message.statuscode = data.readIntBE(28, 1);
	if (message.statuscode == 0) {
	    message.success = true;
	} else {
	    message.success = false;
	}
	message.reroute_count = data.readIntBE(29, 2);
	break;
    case TYPE_STATEVECT:
	//console.log("decoding TYPE_STATEVECT");

	var state_vector_fields = [
	    {name: "localization_2d"},
	    {name: "localization_3d"},
	    {name: "mapping_2d"},
	    {name: "mapping_3d"},
	    {name: "collision_mapping"},
	    {name: "motors_on"},
	    {name: "autonomous_exploration"},
	    {name: "big_localization_area"},
	    {name: "vacuum_app"},
	    {name: "reserved3"},
	    {name: "reserved4"},
	    {name: "reserved5"},
	    {name: "reserved6"},
	    {name: "reserved7"},
	    {name: "reserved8"},
	    {name: "reserved9"}
	];

	for (var i = 0; i < STATE_VECT_LENGTH; i++) {
	    var tmp = data.readIntBE(i, 1);
	    if (tmp == 0) {
		state_vector_fields[i].data = false;
	    } else {
		state_vector_fields[i].data = true;
	    }
	}

	for (var entry of state_vector_fields) {
	    message[entry.name] = entry.data;
	}
	
	break;
    case TYPE_LOCALIZATION_RESULT:
	// This message has no payload
	break;

    default:
	console.log("Unknown message, opcode", opcode, "length", length, "data:", data);
	break;
    }

    return message;
}

module.exports = {
    TYPE_VOXEL_MAP,
    TYPE_PWR_STATUS,
    TYPE_TOF_DIAGNOSTICS,
    TYPE_HW_POSE,
    TYPE_DRIVE_DIAGNOSTICS,
    TYPE_DEST,
    TYPE_ROUTE,
    TYPE_CHARGE,
    TYPE_MODE,
    TYPE_MANU,
    TYPE_ADDCONSTRAINT,
    TYPE_REMCONSTRAINT,
    TYPE_ROUTEINFO,
    TYPE_SYNCREQ,
    TYPE_INFOSTATE,
    TYPE_ROBOTINFO,
    TYPE_MOVEMENT_STATUS,
    TYPE_ROUTE_STATUS,
    TYPE_STATEVECT,
    TYPE_LOCALIZATION_RESULT,
    encodeMessage,
    decodeMessage
}
