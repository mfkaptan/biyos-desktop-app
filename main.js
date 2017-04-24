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

const Biyos = require('./biyos')
const biyos = new Biyos()

/* Login */
ipcMain.once("login", (e, args) => {
  console.log("Giriş yapılıyor")
  biyos.login(e)
})

/* Send sayac data */
ipcMain.on("sayac-veri", (e, args) => {
  console.log("Veriler toplanıyor")
  biyos.getAllSayacTotal(e)
})

/* Send paylasim hesap */
ipcMain.on("paylasim-hesap", (e, args) => {
  console.log("Paylasim hesaplaniyor")
  biyos.calculatePaylasim(e, args)
})

/* Otomatik borclandir */
ipcMain.on("oto-borclandir", (e, args) => {
  console.log("Otomatik borçlandırma başlatılıyor")
  biyos.otoBorclandir(e, args)
})

/* Print apartman Borc */
ipcMain.on("apartman-yazdir", (e, args) => {
  console.log("Apartman borcu yazdırılıyor.")
  biyos.printApartmanBorc(e, args)
})

/* Print tekil Borc */
ipcMain.on("tekil-yazdir", (e, args) => {
  console.log("Tekil borç yazdırılıyor.")
  biyos.printTekilBorc(e, args)
})
