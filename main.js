const {
  app,
  BrowserWindow,
  globalShortcut,
  Menu,
  dialog,
} = require("electron");
const { autoUpdater } = require("electron-updater");
const path = require("path");

let mainWindow;

app.on("window-all-closed", function() {
  if (process.platform != "darwin") {
    app.quit();
  }
});

app.on("ready", function() {
  autoUpdater.checkForUpdatesAndNotify();
  mainWindow = new BrowserWindow({
    width: 1280,
    fullscreen: false,
    webPreferences: {
      minimumFontSize: 18,
      preload: path.join(__dirname, "customisations.js"),
    },
    height: 720,
    title: "Мой Склад",
    webSecurity: true,
    "node-integration": false,
  });
  // mainWindow.webContents.openDevTools();

  mainWindow.setMenu(null);
  mainWindow.loadURL("https://online.moysklad.ru/app/");

  mainWindow.on("app-command", function(e, cmd) {
    if (cmd === "browser-backward" && mainWindow.webContents.canGoBack()) {
      mainWindow.webContents.goBack();
    } else if (
      cmd === "browser-forward" &&
      mainWindow.webContents.canGoForward()
    ) {
      mainWindow.webContents.goForward();
    }
  });

  // Global shortcuts..

  app.showExitPrompt = true;
  // Inside main/index.js, where BrowserWindow is initialized
  mainWindow.on("close", e => {
    if (app.showExitPrompt) {
      e.preventDefault(); // Prevents the window from closing
      dialog.showMessageBox(
        {
          type: "question",
          buttons: ["Да, уверен", "Вернуться обратно"],
          title: "Подтверждение",
          message:
            "Вы уверены, что хотите выйти? Изменения не будут сохранены!",
        },
        function(response) {
          if (response === 0) {
            app.showExitPrompt = false;
            mainWindow.close();
          }
        },
      );
    }
  });

  mainWindow.on("closed", function() {
    mainWindow = null;
  });
  var menuTemplate = [
    {
      label: "Application",
      submenu: [
        { label: "О Приложении", selector: "orderFrontStandardAboutPanel:" },
        { type: "separator" },
        {
          label: "Настройка меню",
          accelerator: "CmdOrCtrl+Shift+M",
          click: function() {
            if (mainWindow && mainWindow.webContents) {
              mainWindow.webContents.executeJavaScript(
                "if (typeof createCustomizationOverlay === 'function') { createCustomizationOverlay(); }"
              ).catch(err => {
                console.error('Error opening customization overlay:', err);
              });
            }
          },
        },
        { type: "separator" },
        {
          label: "Выйти",
          accelerator: "CmdOrCtrl+Q",
          click: function() {
            app.quit();
          },
        },
      ],
    },
    {
      label: "Edit",
      submenu: [
        { label: "Undo", accelerator: "CmdOrCtrl+Z", selector: "undo:" },
        { label: "Redo", accelerator: "Shift+CmdOrCtrl+Z", selector: "redo:" },
        { type: "separator" },
        { label: "Вырезать", accelerator: "CmdOrCtrl+X", selector: "cut:" },
        { label: "Скопировать", accelerator: "CmdOrCtrl+C", selector: "copy:" },
        { label: "Вставить", accelerator: "CmdOrCtrl+V", selector: "paste:" },
        {
          label: "Выделить Все",
          accelerator: "CmdOrCtrl+A",
          selector: "selectAll:",
        },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate));
});

function skip() {
  if (mainWindow == null) {
    return;
  }

  mainWindow.webContents.executeJavaScript(
    "document.getElementsByClassName('modules-music-player-css-Skip__skip___iZcPm')[0].click()",
  );
}

function playPause() {
  if (mainWindow == null) {
    return;
  }

  mainWindow.webContents.executeJavaScript(
    "document.getElementsByClassName('modules-music-player-css-PlayControl__wrapper___2ROhW')[0].click()",
  );
}
