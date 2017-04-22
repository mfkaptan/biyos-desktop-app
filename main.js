const electron = require('electron')
const app = electron.app
const ipcMain = electron.ipcMain
const BrowserWindow = electron.BrowserWindow

const path = require('path')
const url = require('url')

let mainWindow

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({ width: 800, height: 600 })

  // and load the index.html of the app.
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }))

  // Open the DevTools.
  mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function() {
    mainWindow = null
  })
}

// This method will be called when Electron has finished
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function() {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function() {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

const tabletojson = require('tabletojson');
var Promise = require('bluebird');
const request = require('request').defaults({ jar: true });
const xray = require('x-ray')();
const makeDriver = require('request-x-ray')
const driver = makeDriver(request.defaults())
xray.driver(driver)


const Biyos = {
  HOME: "https://app.biyos.net",
  DAIRE_COUNT: 48,
  login: () => { return Biyos.HOME + "/login.php" },
  suSayac: () => { return Biyos.HOME + "/yonetim/sayaclar/sicaksu" },
  kaloriSayac: () => { return Biyos.HOME + "/yonetim/sayaclar/kalorimetre" }
}

const uname = "mbkaptan@gmail.com",
  pass = "mbk20060"


ipcMain.once("login", (e, args) => {
  const email = uname,
    pwd = pass
  request.post({
    url: Biyos.login(),
    form: {
      email: email,
      password: pwd
    }
  }, function(error, response, body) {
    if (error != null) {
      console.log("Cannot login!")
      e.sender.send("login", "Hata: Giriş yapılamadı!")
      return;
    }
    Biyos.HOME += response.headers.location

    e.sender.send("login", "Giriş yapıldı.")
  })
})


/* Send sayac data */
ipcMain.on("sayac-veri", (e, args) => {
  console.log("Veriler toplanıyor")

  Promise.all([getSayacTotal(Biyos.suSayac()), getSayacTotal(Biyos.kaloriSayac())])
    .then(values => {
      let sayacData = {
        suTotal: values[0],
        kaloriTotal: values[1],
        kaloriAvg: values[1] / Biyos.DAIRE_COUNT,
      }
      e.sender.send("sayac-veri", sayacData)
    })
})

function sumSayac(table) {
    let total = tabletojson.convert('<table>' + table + '</table>')[0].sum('5');

    // data = data.map(function(entry) {
    //   return {
    //     block: entry['0'],
    //     no: entry['1'],
    //     name: entry['2'],
    //     diff: entry['5']
    //   }
    // })
    console.log(total)
    return total;
}

function getSayacTotal(sayacUrl) {
  return Promise.promisify(xray(sayacUrl, 'table@html'))()
    .then(sumSayac)
}

Array.prototype.sum = function(prop) {
  let total = 0
  for (let i = 0; i < this.length; i++) {
    total += parseInt(this[i][prop])
  }
  return total
}
