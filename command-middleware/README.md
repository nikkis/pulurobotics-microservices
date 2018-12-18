Robot state object
 * x: current x-coordinate (integer)
 * y: current y-coordinate (integer)
 * size_x: (integer)
 * size_y: (integer)
 * angle: (integer)
 * status: idle, think, forward, reverse, left, right, charging, daijuing (string)
 * motors_on: (boolean)
 * autonomous_exploration: (boolean)
 * battery: (object)
 ** charging: (boolean)
 ** charge_finished: (boolean)
 ** voltage: (double)
 ** percentage: (integer)
 ** charge_voltage: (double)
 * lidar: (object)
 ** offset_x: (integer)
 ** offset_y: (integer)

SocketIO commands
 * start_mapping: start driving around to create map
 * go(x, y): calculate a route to coordinate (x,y), avoiding obstacles, and go there
 * go_straight(x, y, mode): go straight to coordinate (x,y); mode must be "forward" or "reverse"
 * stop: stop immediately
 * add_obstacle(x, y): add an obstacle at coordinate (x,y)
 * remove_obstacle(x, y): remove an obstacle at coordinate (x,y)