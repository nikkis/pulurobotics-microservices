Command middleware for Pulurobotics robot
=========================================

The command middleware communicates with the robot through TCP using a binary protocol, and exposes a Socket.IO interface to obtain information about the robot and to control it.

SocketIO messages sent *from* the middleware
------------------------------------------

The middleware sends the following commands with the specified payload. The payload objects are described in more detail below.

 * robot_status: Payload: a robot status object.
 * middleware_status: Payload: a middleware status object.
 * routeinfo: Payload: A route info object.
 * movement_status: Describes the result of a straight movement operation. Payload: a straight movement status object.
 * route_status: Describes the result of a routing movement operation. Payload: a routing movement status object.
 * sync_request: A notification that maps have been updated and should be synchronised. Payload: Empty.
 * localization_result: Result of mapping? (TODO: Unverified.) Payload: Empty.
 * command_received: Sent when a command has been successfully received. Payload: an object of the format {command: <string>}, with the string being the name of the command which triggered this message.

SocketIO messages sent *to* the middleware
----------------------------------------

Each message results in a `command_received` message being sent from the middleware (see above).

 * start_mapping: Start driving around to create map.
 * go(point): Calculate a route to a specified point, avoiding obstacles, and go there.
   * point: {x, y} – x and y must be integers. The unit is mm.
 * go_straight(point, mode): Go straight to point, either forward or backwards.
   * point: {x, y} – x and y must be integers. The unit is mm.
   * mode (string): Either "forward" or "reverse".
 * go_list(list): For each point in the list, calculate a route to it, avoiding obstacles, and go there. If a point cannot be reached, skip it.
   * list: [ {x1, y1}, {x2, y2}, ... ] – xn and yn must be integers. The unit is mm.
 * stop: Stop the current operation. Note: Does not guarantee that the robot stops immediately.
 * add_obstacle(point): Add an obstacle at point.
   * point: {x, y} – x and y must be integers. The unit is mm.
 * remove_obstacle(point): Remove an obstacle at point.
   * point: {x, y} – x and y must be integers. The unit is mm.

Payload objects
---------------

In the messages described above, the following payload objects are used:

### Robot status object

 * x (integer): Robot's current x-coordinate in mm. The origin is determined by the location at start-up.
 * y (integer): Robot's current y-coordinate in mm. The origin is determined by the location at start-up.
 * size_x (integer): Robot's x-size in mm.
 * size_y (integer): Robot's y-size in mm.
 * origin_x (integer): Robot's x-origin (center of rotation) in mm.
 * origin_y (integer): Robot's y-origin (center of rotation) in mm.
 * angle (integer): Robot's angle in degrees. The starting angle is determined at start-up.
 * status (string): A string describing the current processing state of the robot. Possible values:
   * "idle" – The robot is idle.
   * "think" – The robot is processing, e.g., calculating a route.
   * "forward" – The robot is moving forward.
   * "reverse" – The robot is moving backward.
   * "left" – The robot is turning left.
   * "right" – The robot is turning right.
   * "charging" – The robot is charging.
   * "daijuing" – The robot is randomly moving whereever possible as a last resort when route-finding fails.
 * motors_on (boolean): Whether the motors are engaged on not.
 * autonomous_exploration (boolean): Whether the robot is autonomously exploring its surroundings.
 * battery (object): An object describing the robot's battery and charging state.
   * charging (boolean): Whether the robot is currently charging.
   * charge_finished (boolean): Whether the charging operation has finished.
   * voltage (double): The current voltage of the battery.
   * percentage (integer): The state of charge of the battery (how "full" it is).
   * charge_voltage (double): The current voltage fed from the charger.
 * lidar (object): An object representing data from the robot's lidar sensor.
   * offset_x (integer): Not documented.
   * offset_y (integer): Not documented.

### Middleware status object

 * robot_connection_active (boolean): True if the connection to the robot is active, false otherwise.
 * connected_clients (integer): The number of clients that are connected to the middleware.

### Route info object

 * start (object): An object describing the starting point of the route.
   * x (integer): The x coordinate of the starting point, in mm.
   * y (integer): The y coordinate of the starting point, in mm.
 * points (list): A list of points describing the route.
   * point: {x, y} – x and y must be integers. The unit is mm.

### Straight movement status object

 * start (object): An object describing the starting point and angle.
   * x (integer): The x starting position in mm.
   * y (integer): The y starting position in mm.
   * angle (double): The starting angle in degrees.
 * requested (object): An object describing the requested destination.
   * x (integer): The requested destination x position in mm.
   * y (integer): The requested destination y position in mm.
   * backmode (integer): The requested driving direction.
 * current (object): An object describing the current location.
   * x (integer): The current x position in mm.
   * y (integer): The current y position in mm.
   * angle (double): The current angle in degrees.
 * statuscode (integer): A status code describing the movement.
 * success (boolean): Whether the movement succeeded or not.
 * hardware_obstacle_flags: Not documented.

### Routing movement status object

 * start (object): An object describing the starting point and angle.
   * x (integer): The x starting position in mm.
   * y (integer): The y starting position in mm.
   * angle (double): The starting angle in degrees.
 * requested (object): An object describing the requested destination.
   * x (integer): The requested destination x position in mm.
   * y (integer): The requested destination y position in mm.
   * backmode (integer): The requested driving direction.
 * current (object): An object describing the current location.
   * x (integer): The current x position in mm.
   * y (integer): The current y position in mm.
   * angle (double): The current angle in degrees.
 * statuscode (integer): A status code describing the movement.
 * success (boolean): Whether the movement succeeded or not.
 * reroute_count (integer): How many times the route was changed on the way.