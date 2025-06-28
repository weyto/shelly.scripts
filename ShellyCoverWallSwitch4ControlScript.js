// This script manages a Shelly cover by listening to virtual and physical button events,
// then issues open, close, or stop commands based on the cover’s current state, and can
// also trigger button events on another Shelly device.

// Initialize Shelly Script

const EVENT_ALL = "all";
const EVENT_BUTTON_SINGLE_PUSH = "single_push";
const EVENT_BUTTON_DOUBLE_PUSH = "double_push";
const EVENT_BUTTON_TRIPLE_PUSH = "triple_push";
const EVENT_BUTTON_LONG_PUSH = "long_push";

/**
 * Configuration object for Shelly Cover Wall Switch Control Script.
 *
 * @typedef {Object} Config
 * @property {number} coverId - The ID of the cover to control.
 * @property {Array<VirtualComponent>} virtualComponents - List of virtual components.
 * @property {Array<EventAction>} eventActions - List of event actions.
 */

/**
 * Virtual component configuration.
 *
 * @typedef {Object} VirtualComponent
 * @property {string} key - Unique key for the virtual component.
 * @property {string} name - Name of the virtual component.
 */

/**
 * Event action configuration.
 *
 * @typedef {Object} EventAction
 * @property {string} component - The component triggering the event.
 * @property {string} event - The event type to listen for.
 * @property {Function} action - The function to execute when the event occurs.
 */

/**
 * @type {Config}
 */
let CONFIG = {
	coverId: 0,
	// Add debug configuration to control logging output
	debug: false,
	virtualComponents: [
		{
			key: "button:200",
			name: "CoverAction Open",
		},
		{
			key: "button:201",
			name: "CoverAction Close",
		},
	],
	eventActions: [
		// Virtual Components Event
		{
			component: "button:200",
			event: EVENT_ALL,
			action: function () {
				print("CoverAction Open Event");
				handleCoverAction("open");
			},
		},
		{
			component: "button:201",
			event: EVENT_ALL,
			action: function () {
				print("CoverAction Close Event");
				handleCoverAction("close");
			},
		},
		// Physical Components Event
		{
			component: "bthomesensor:201",
			event: EVENT_ALL,
			action: function (event) {
				print("TOP LEFT BUTTON PRESSED EVENT");
				handleCoverAction("open");
			},
		},
		{
			component: "bthomesensor:202",
			event: EVENT_ALL,
			action: function (event) {
				print("BOTTOM LEFT BUTTON PRESSED EVENT");
				handleCoverAction("close");
			},
		},
		{
			component: "bthomesensor:203",
			event: EVENT_ALL,
			action: function (event) {
				print("TOP RIGHT BUTTON PRESSED EVENT");
				// triggerButtonEvent("192.168.2.42", 200, "single_push");
			},
		},
		{
			component: "bthomesensor:204",
			event: EVENT_ALL,
			action: function (event) {
				print("BOTTOM RIGHT BUTTON PRESSED EVENT");
				// triggerButtonEvent("192.168.2.42", 200, "single_push");
			},
		},
		{
			component: "bthomedevice:200",
			event: EVENT_ALL,
			action: function (event) {
				switch (event.info.idx) {
					case 0:
						print("TOP LEFT BUTTON PRESSED EVENT");
						handleCoverAction("open");
						break;
					case 1:
						print("BOTTOM LEFT BUTTON PRESSED EVENT");
						handleCoverAction("close");
						break;
					case 2:
						print("TOP RIGHT BUTTON PRESSED EVENT");
						handleCoverAction("open");
						break;
					case 3:
						print("BOTTOM RIGHT BUTTON PRESSED EVENT");
						handleCoverAction("close");
						break;
				}
			},
		},
	],
};

/**
 * Logs messages only when debug mode is enabled
 * @param {string} message - The message to log
 */
function debugLog(message) {
	if (CONFIG.debug) {
		print("[DEBUG] " + message);
	}
}

/**
 * Logs error messages with timestamp
 * @param {string} message - The error message to log
 * @param {Error} [error] - Optional error object
 */
function errorLog(message, error) {
	const timestamp = new Date().toISOString();
	let errorMessage = "[ERROR] " + timestamp + " - " + message;

	if (error) {
		errorMessage += ": " + error.toString();
	}

	print(errorMessage);
}

function coverStop() {
	print("Stopping cover");
	Shelly.call(
		"Cover.Stop",
		{ id: CONFIG.coverId },
		function (_, error_code, error_message) {
			// the request is successful
			if (error_code === 0) {
				print("Cover is stopped");
			} else {
				errorLog("Failed to stop cover", error_message);
			}
		}
	);
}

function coverOpen() {
	print("Opening cover");
	Shelly.call(
		"Cover.Open",
		{ id: CONFIG.coverId },
		function (_, error_code, error_message) {
			// the request is successfull
			if (error_code === 0) {
				print("Cover is opening");
			} else {
				errorLog("Failed to open cover", error_message);
			}
		}
	);
}

function coverClose() {
	print("Closing cover");
	Shelly.call(
		"Cover.Close",
		{ id: CONFIG.coverId },
		function (_, error_code, error_message) {
			// the request is successfull
			if (error_code === 0) {
				print("Cover is closing");
			} else {
				errorLog("Failed to close cover", error_message);
			}
		}
	);
}

function coverIsMoving(status) {
	return (
		status.state === "opening" ||
		status.state === "closing" ||
		status.state === "calibrating"
	);
}

/**
 * Executes open/close actions or stops the cover if it's already moving.
 * @param {"open"|"close"} action - The desired cover action.
 */
function handleCoverAction(action) {
	let status = Shelly.getComponentStatus("cover", CONFIG.coverId);
	if (!status) {
		errorLog("Unable to retrieve cover status");
		return;
	}

	if (coverIsMoving(status)) {
		coverStop();
	} else if (action === "open" && status.state !== "open") {
		coverOpen();
	} else if (action === "close" && status.state !== "close") {
		coverClose();
	} else {
		debugLog("Cover is already in the " + status.state + " state");
	}
}

function triggerButtonEvent(deviceIp, buttonId, event) {
	if (!deviceIp || !buttonId || !event) {
		errorLog("Missing arguments for triggerButtonEvent");
		return;
	}

	let url =
		"http://" +
		deviceIp +
		"/rpc/Button.Trigger?id=" +
		buttonId +
		"&event=" +
		event;
	print(
		"Triggering event: " +
			event +
			" (Button: " +
			buttonId +
			", Device: " +
			deviceIp +
			")"
	);

	Shelly.call(
		"HTTP.GET",
		{ url: url },
		function (response, error_code, error_message) {
			if (error_code === 0) {
				print("Trigger successful");
			} else {
				errorLog("HTTP request failed", error_message);
			}
		}
	);
}

function initVirtualComponents() {
	print("Initializing virtual components");
	CONFIG.virtualComponents.forEach(function (config) {
		let component = Shelly.getComponentConfig(config.key);

		if (component === null || component.name !== config.name) {
			if (component !== null) {
				debugLog("Deleting virtual component: " + config.key);
				Shelly.call("Virtual.Delete", { key: config.key });
			}

			debugLog("Adding virtual component: " + config.key);
			let type = config.key.split(":")[0];
			Shelly.call("Virtual.Add", {
				type: type,
				config: {
					name: config.name,
				},
			});
		}
	});
	print("Virtual components initialized");
}

function initEventActions() {
	print("Initializing event actions");
	Shelly.addEventHandler(function (event) {
		// Check if the event is from a relevant component
		if (
			!(
				event.component.indexOf("bthomesensor:") === 0 ||
				event.component.indexOf("bthomedevice:") === 0 ||
				event.component.indexOf("button:") === 0
			)
		) {
			return;
		}

		debugLog("Event received: " + JSON.stringify(event));

		CONFIG.eventActions.forEach(function (eac) {
			if (
				event.component === eac.component &&
				(event.info.event === eac.event || eac.event === EVENT_ALL)
			) {
				eac.action(event);
				return;
			}
		});
	});
	print("Event actions initialized");
}

// Set debug mode and start the script
print("Starting Shelly Cover Wall Switch Control script");
// To enable debugging, set CONFIG.debug to true
// CONFIG.debug = true;
initVirtualComponents();
Timer.set(1000, false, function () {
	try {
		initEventActions();
	} catch (err) {
		errorLog("Error initializing event actions", err);
	}
});
