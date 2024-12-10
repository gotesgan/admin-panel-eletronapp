const { app, BrowserWindow, Menu, session } = require("electron"),
	path = require("node:path"),
	fs = require("fs");
let mainWindow, splashWindow;
const createWindow = () => {
	mainWindow = new BrowserWindow({
		width: 800,
		height: 600,
		icon: path.join(__dirname, "singonaa_logo.png"),
		show: false,
		webPreferences: {
			preload: path.join(__dirname, "preload.js"),
			nodeIntegration: false,
			contextIsolation: true,
		},
	});
	splashWindow = new BrowserWindow({
		width: 600,
		height: 600,
		frame: false,
		alwaysOnTop: true,
		transparent: true,
		resizable: false,
		webPreferences: { preload: path.join(__dirname, "preload.js") },
	});
	splashWindow.loadFile(path.join(__dirname, "splash.html"));
	const reactBuildPath = path.join(__dirname, "build", "index.html");
	if (fs.existsSync(reactBuildPath)) mainWindow.loadFile(reactBuildPath);
	mainWindow.webContents.once("did-finish-load", () => {
		setTimeout(() => {
			splashWindow.webContents.executeJavaScript(
				"document.body.style.transition='opacity 1s ease-out';document.body.style.opacity=0;",
				true
			);
			splashWindow.webContents
				.executeJavaScript(
					"new Promise(resolve=>{document.body.addEventListener('transitionend',resolve,{once:true});})"
				)
				.then(() => {
					splashWindow.close();
					mainWindow.show();
				});
		}, 5000);
	});
	handleSession();
};
const handleSession = () => {
	session.defaultSession.cookies.on("changed", () => {});
};
Menu.setApplicationMenu(null);
app.whenReady().then(() => {
	createWindow();
	app.on("activate", () => {
		if (BrowserWindow.getAllWindows().length === 0) createWindow();
	});
});
app.on("window-all-closed", () => {
	if (process.platform !== "darwin") app.quit();
});
