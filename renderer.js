// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
$(document).ready(function() {
  window.ipcRenderer = require("electron").ipcRenderer

  ipcRenderer.send("login")

  ipcRenderer.on("login", (event, msg) => {
    console.log(msg)
    $("#login-progress").text(msg)
  })

  $("#sayacVeri").on("click", function (event, args) {
    ipcRenderer.send('sayac-veri')
  })

  ipcRenderer.on("sayac-veri", (event, msg) => {
    $("#suToplam").val(msg.suTotal)
    $("#kaloriToplam").val(msg.kaloriTotal)
    $("#kaloriOrt").val(msg.kaloriAvg)
  })
})
