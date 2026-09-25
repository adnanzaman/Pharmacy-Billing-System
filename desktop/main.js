const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('path');
const fs = require('fs');


// ============================================================
// SETTINGS
// ============================================================

const isDev = false;


// ============================================================
// CREATE MAIN WINDOW
// ============================================================

function createWindow() {

  const win = new BrowserWindow({
    width: 1440,
    height: 900,

    minWidth: 1024,
    minHeight: 700,

    backgroundColor: '#f5f7fb',

    show: false,

    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true
    }
  });


  // ==========================================================
  // SHOW WINDOW WHEN READY
  // ==========================================================

  win.once('ready-to-show', () => {
    win.show();
  });


  // ==========================================================
  // EXTERNAL LINKS
  // ==========================================================

  win.webContents.setWindowOpenHandler(({ url }) => {

    if (url.startsWith('http://') || url.startsWith('https://')) {

      shell.openExternal(url);

      return {
        action: 'deny'
      };
    }

    return {
      action: 'allow'
    };
  });


  // ==========================================================
  // DEVELOPMENT
  // ==========================================================

  if (isDev) {
    //const devUrl = 'https://portal-h.raas-llc.com';
    const devUrl = 'http://localhost:5173';

   // console.log('========================================');
    //console.log('Punjab Hospital ERP');
    //console.log('MODE: DEVELOPMENT');
    //console.log('URL:', devUrl);
    //console.log('========================================');

    win.loadURL(devUrl);

    win.webContents.openDevTools({
      mode: 'detach'
    });

  }


  // ==========================================================
  // PRODUCTION
  // ==========================================================

  else {

    /*
      electron-builder configuration:

      extraResources:
      ../web/dist
      ->
      resources/web/dist

      Therefore production React file is:

      process.resourcesPath
      + web
      + dist
      + index.html
    */

    const builtIndex = path.join(
      process.resourcesPath,
      'web',
      'dist',
      'index.html'
    );


    //console.log('');
    //console.log('========================================');
    //co`nsole.log('Punjab Hospital ERP Desktop');
   // console.log('========================================');

   // console.log('Electron directory:');
    //console.log(__dirname);

    //console.log('');

    //console.log('Resources directory:');
    //console.log(process.resourcesPath);

    //console.log('');

    //console.log('React index:');
    //console.log(builtIndex);

    //console.log('');

    //console.log('React index exists:');
    //console.log(fs.existsSync(builtIndex));

    ///console.log('========================================');
    //console.log('');


    // ========================================================
    // LOAD REACT APPLICATION
    // ========================================================

    if (fs.existsSync(builtIndex)) {

      //console.log('Loading React application...');

      win.loadFile(builtIndex)
        .then(() => {

         // console.log(
         //   'React application loaded successfully.'
         // );

        })
        .catch((error) => {

          console.error(
            'Error loading React application:',
            error
          );

        });


      // ------------------------------------------------------
      // OPEN DEVTOOLS FOR DEBUGGING
      // ------------------------------------------------------

      win.webContents.openDevTools({
        mode: 'detach'
      });

    }


    // ========================================================
    // REACT BUILD NOT FOUND
    // ========================================================

    else {

      console.error(
        'React production build was NOT found.'
      );


      const errorHtml = `
<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8">

<title>Punjab Hospital - Build Error</title>

<style>

body {
  margin: 0;
  padding: 40px;
  background: #f5f7fb;
  font-family: Arial, sans-serif;
  color: #333;
}

.container {
  max-width: 900px;
  margin: auto;
  background: white;
  padding: 35px;
  border-radius: 14px;
  box-shadow: 0 5px 25px rgba(0,0,0,0.08);
}

h1 {
  color: #d4380d;
}

h2 {
  color: #555;
}

pre {
  background: #f5f5f5;
  padding: 18px;
  border-radius: 8px;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
}

.footer {
  margin-top: 30px;
  color: #888;
  font-size: 13px;
}

</style>

</head>

<body>

<div class="container">

<h1>
Punjab Hospital
</h1>

<h2>
React Web Build Not Found
</h2>

<p>
Electron started correctly, but the React production
build could not be found.
</p>

<p>
Expected file:
</p>

<pre>${builtIndex}</pre>

<p>
Expected packaged structure:
</p>

<pre>
resources
└── web
    └── dist
        ├── index.html
        └── assets
            ├── *.js
            └── *.css
</pre>

<div class="footer">
Xmart Solutions LLC
</div>

</div>

</body>

</html>
`;


      win.loadURL(
        'data:text/html;charset=UTF-8,' +
        encodeURIComponent(errorHtml)
      );

    }

  }


  // ==========================================================
  // APPLICATION MENU
  // ==========================================================

  const applicationMenu = Menu.buildFromTemplate([

    {
      label: 'Punjab Hospital',

      submenu: [

        {
          label: 'Reload',
          role: 'reload'
        },

        {
          label: 'Developer Tools',
          role: 'toggleDevTools'
        },

        {
          type: 'separator'
        },

        {
          label: 'Quit',
          role: 'quit'
        }

      ]
    },


    {
      role: 'editMenu'
    },


    {
      role: 'windowMenu'
    }

  ]);


  Menu.setApplicationMenu(applicationMenu);

}


// ============================================================
// ELECTRON READY
// ============================================================

app.whenReady().then(() => {

  createWindow();


  app.on('activate', () => {

    if (
      BrowserWindow.getAllWindows().length === 0
    ) {

      createWindow();

    }

  });

});


// ============================================================
// CLOSE ALL WINDOWS
// ============================================================

app.on('window-all-closed', () => {

  if (process.platform !== 'darwin') {

    app.quit();

  }

});