const { app, BrowserWindow, Menu, session } = require("electron");
const path = require("node:path");

let mainWindow;
let splashWindow;

const createWindow = () => {
	// Create the main window first, without showing it
	mainWindow = new BrowserWindow({
		icon: path.join(__dirname, "singonaa_logo.png"),
		width: 800,
		height: 600,
		show: false, // Do not show the main window until it's ready
		webPreferences: {
			preload: path.join(__dirname, "preload.js"),
			nodeIntegration: false, // Disable node integration for security
			contextIsolation: true, // Enable context isolation for security
			cookies: true, // Automatically manage cookies (enabled by default)
			enableWebSQL: false, // Disable WebSQL if not needed
		},
	});

	// Create the splash screen with the same size as the main window
	splashWindow = new BrowserWindow({
		width: 600, // Fixed size to ensure correct splash display
		height: 600, // Same as main window size
		frame: false,
		alwaysOnTop: true,
		transparent: true,
		resizable: false,
		webPreferences: {
			preload: path.join(__dirname, "preload.js"),
		},
	});

	// Load splash screen HTML
	splashWindow.loadFile(path.join(__dirname, "splash.html"));

	// Define the path to the build directory of the React app
	const reactBuildPath = path.join(__dirname, "build", "index.html");

	// Check if the React build file exists
	try {
		mainWindow.loadFile(reactBuildPath);
	} catch (error) {
		console.error(
			"React build not found. Please ensure you run 'vite build' first."
		);
	}

	// Show the main window after it's fully loaded
	mainWindow.webContents.once("did-finish-load", () => {
		setTimeout(() => {
			// Fade-out the splash window with transition
			splashWindow.webContents.executeJavaScript(
				"document.body.style.transition = 'opacity 1s ease-out'; document.body.style.opacity = 0;",
				true
			);

			// Wait until the transition is complete
			splashWindow.webContents
				.executeJavaScript(
					`
				new Promise(resolve => {
					document.body.addEventListener('transitionend', resolve, {once: true});
				});
			`
				)
				.then(() => {
					splashWindow.close(); // Close splash window after the fade-out animation
					mainWindow.show(); // Show the main window
				});
		}, 5000); // Keep splash screen for 5 seconds
	});

	// Open Developer Tools automatically for debugging (comment out for production)
	// mainWindow.webContents.openDevTools();

	// Enable session and cookies to be handled automatically
	handleSession();
};

// Function to manage session automatically
const handleSession = () => {
	const defaultSession = session.defaultSession;

	// Listen for cookie changes automatically
	defaultSession.cookies.on("changed", (event, cookie, cause, removed) => {
		if (!removed) {
			console.log("Cookie added or updated:", cookie);
		} else {
			console.log("Cookie removed:", cookie);
		}
	});
};

// Prevent the default application menu from appearing
Menu.setApplicationMenu(null);

app.whenReady().then(() => {
	createWindow();

	app.on("activate", () => {
		if (BrowserWindow.getAllWindows().length === 0) {
			createWindow();
		}
	});
});

app.on("window-all-closed", () => {
	if (process.platform !== "darwin") app.quit();
});
