// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
$(document).ready(function() {
  window.ipcRenderer = require("electron").ipcRenderer

  // Login
  ipcRenderer.send("login")

  ipcRenderer.on("login", (event, msg) => {
    console.log(msg)
    $("#login-progress").text(msg)
  })

  // Sayac Veri
  $("#sayacVeri").on("click", (event, args) => {
    ipcRenderer.send('sayac-veri')
  })

  ipcRenderer.on("sayac-veri", (event, msg) => {
    $("#suToplam").val(msg.suTotal)
    $("#kaloriToplam").val(msg.kaloriTotal)
    $("#kaloriOrt").val(msg.kaloriAvg)
  })

  // Paylasim Hesap
  $("#paylasimHesap").on("click", (event, args) => {
    let data = {
      fatura: parseFloat($("#fatura").val()),
      suBirim: parseFloat($("#suBirim").val()),
      gazBirim: parseFloat($("#gazBirim").val())
    }

    if (!data.fatura) {
      alert("Fatura girip tekrar deneyin!")
      return
    }

    ipcRenderer.send("paylasim-hesap", data)
  })

  ipcRenderer.on("paylasim-hesap", (event, msg) => {
    $("#paylastir").val(msg.gaz)
    $("#ortak").val(msg.ortak)
    $("#aidat").val(msg.aidat)
  })

  // Otomatik Borclandir
  $("#borclandir").on("click", (event, args) => {
    let data = {
      fatura: parseFloat($("#fatura").val()),
      suBirim: parseFloat($("#suBirim").val()),
      gazBirim: parseFloat($("#gazBirim").val())
    }

    if (!data.fatura) {
      alert("Fatura girip tekrar deneyin!")
      return
    }

    ipcRenderer.send("oto-borclandir", data)
  })

  ipcRenderer.on("oto-borclandir", (event, msg) => {

  })

  // Apartman Yazdir
  $("#apartmanYazdir").on("click", (event, args) => {
    let data = {
      suBirim: parseFloat($("#suBirim").val()),
      gazBirim: parseFloat($("#gazBirim").val()),
      paylasim: parseInt($("#paylasim").val()),
    }
    ipcRenderer.send('apartman-yazdir', data)
  })

  ipcRenderer.on("apartman-yazdir", (event, msg) => {
    if (msg === "success") {
      $("#apartmanYazdir").removeClass("btn-primary").addClass("btn-positive")
      $("#apartmanYazdir").text("Tablo yazdırıldı!")
    }
  })
})
