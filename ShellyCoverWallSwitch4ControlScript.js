// This script controls a Shelly cover device using button events.
// It listens for button presses to open, close, or stop the cover.
// The cover's state is checked to determine if it is currently moving.

// Initialize Shelly Script
let CONFIG = {
	coverId: 0,
};

// const EVENT_BUTTON_PUSH = "single_push";
// const EVENT_BUTTON_DOUBLE_PUSH = "double_push";
// const EVENT_BUTTON_TRIPLE_PUSH = "triple_push";
// const EVENT_BUTTON_LONG_PUSH = "long_push";

function coverStop() {
	Shelly.call(
		"Cover.Stop",
		{ id: CONFIG.coverId },
		function (_, error_code, error_message) {
			// the request is successfull
			if (error_code === 0) {
				print("Cover is stopped");
			} else {
				print(error_message);
			}
		}
	);
}

function coverOpen() {
	Shelly.call(
		"Cover.Open",
		{ id: CONFIG.coverId },
		function (_, error_code, error_message) {
			// the request is successfull
			if (error_code === 0) {
				print("Cover is opening");
			} else {
				print(error_message);
			}
		}
	);
}

function coverClose() {
	Shelly.call(
		"Cover.Close",
		{ id: CONFIG.coverId },
		function (_, error_code, error_message) {
			// the request is successfull
			if (error_code === 0) {
				print("Cover is closing");
			} else {
				print(error_message);
			}
		}
	);
}

function coverIsMoving() {
	let status = Shelly.getComponentStatus("cover", CONFIG.coverId);
	print(status);
	print("State is: " + status.state);
	return coverIsMoving(status);
}

function coverIsMoving(status) {
	return (
		status.state == "opening" ||
		status.state == "closing" ||
		status.state == "calibrating"
	);
}

function isOpenButtonPressed(event) {
	return (
		event.info.component === "bthomesensor:201" ||
		event.info.component === "bthomesensor:203"
	);
}

function isCloseButtonPressed(event) {
	return (
		event.info.component === "bthomesensor:202" ||
		event.info.component === "bthomesensor:204"
	);
}

Shelly.addEventHandler(function (event) {
	// print("Event received");
	// print(event.component);
	// print(event.info.event);

	let status = Shelly.getComponentStatus("cover", CONFIG.coverId);

	if (isOpenButtonPressed(event)) {
		print("Open button pressed");
		if (coverIsMoving(status)) {
			coverStop();
		} else if (status.state != "open") {
			coverOpen();
		}
	} else if (isCloseButtonPressed(event)) {
		print("Close button pressed");
		if (coverIsMoving(status)) {
			coverStop();
		} else if (status.state != "close") {
			coverClose();
		}
	}
});
