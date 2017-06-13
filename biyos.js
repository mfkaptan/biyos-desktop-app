const path = require('path')
const env = require('env2')(path.join(__dirname, 'env.json'))
const tabletojson = require('tabletojson')
const xlsx = require('xlsx-populate')
const Promise = require('bluebird')
const request = require('request').defaults({ jar: true })
const xray = require('x-ray')()
const makeDriver = require('request-x-ray')
const driver = makeDriver(request.defaults())
xray.driver(driver)

function Biyos() {
  this.HOME = "https://app.biyos.net"
  this.DAIRE_COUNT = 48

  this.loginData = () => { return { email: process.env.EMAIL, password: process.env.PASSWORD } }
  this.suSayac = () => { return this.HOME + "/yonetim/sayaclar/sicaksu" }
  this.kaloriSayac = () => { return this.HOME + "/yonetim/sayaclar/kalorimetre" }
  this.paylasimlar = () => { return this.HOME + "/raporlar/paylasimlar/" }
  this.paylasim = (pUrl) => { return this.HOME + "/raporlar/paylasimlar/" + pUrl }
  this.hesaplar = (daire) => { return this.HOME + "/hesaplar/" + (daire.no + 6148 + (daire.blok == "A" ? 0 : 24)) }

  this.login = (e) => {
    let that = this
    request.post({
      url: this.HOME + "/login.php",
      form: this.loginData()
    }, function(error, response, body) {
      if (error != null) {
        console.log("Cannot login!")
        e.sender.send("login", "Hata: Giriş yapılamadı!")
        return
      }
      that.HOME += response.headers.location
      e.sender.send("login", "Giriş yapıldı.")
    })
  }

  this.getTable = (link) => {
    return Promise.promisify(xray(link, 'table@html'))()
      .then(table => {
        return tabletojson.convert('<table>' + table + '</table>')[0]
      })
  }

  this.getApartmanBorc = (paylasimUrl) => {
    paylasimUrl = paylasimUrl || 0

    return Promise.all([this.getTable(this.suSayac()), this.getTable(this.paylasim(paylasimUrl))])
      .then(values => {
        return {
          su: values[0],
          paylasim: values[1].map((row) => {
            return Object.values(row)
          })
        }
      })
  }

  this.getTekilBorc = (daire) => {
    return this.getTable(this.hesaplar(daire))
      .then(table => {
        return {
          su: values[0],
          paylasim: values[1].map((row) => {
            return Object.values(row)
          })
        }
      })
  }

  this.getSayacTotal = (sayacUrl) => {
    return this.getTable(sayacUrl)
      .then(this.sumSayac)
  }

  this.getAllSayacTotal = (e) => {
    return Promise.all([this.getSayacTotal(this.suSayac()), this.getSayacTotal(this.kaloriSayac())])
      .then(values => {
        let sayacData = {
          suTotal: values[0],
          kaloriTotal: values[1],
          kaloriAvg: (values[1] / this.DAIRE_COUNT).toFixed(2)
        }
        e.sender.send("sayac-veri", sayacData)
        return sayacData
      })
  }

  this.calculatePaylasim = (e, args) => {
    return this.getAllSayacTotal(e)
      .then(sayacData => {
        let suDiff = (args.gazBirim - args.suBirim) * sayacData.suTotal
        let sonFiyat = args.fatura - suDiff
        let ortak = sonFiyat / 160. // (sonFiyat * (30 / 100) / 48)
        let aidat = 200. - ortak

        let paylasimData = {
          gaz: sonFiyat.toFixed(2),
          ortak: ortak.toFixed(2),
          aidat: aidat.toFixed(2)
        }

        e.sender.send("paylasim-hesap", paylasimData)
        return paylasimData
      })
  }

  this.sumSayac = (table) => {
    let total = 0
    for (let i = 0; i < table.length; i++) {
      total += parseInt(table[i]['5'])
    }
    return total
  }

  this.printApartmanBorc = (e, args) => {
    this.getApartmanBorc(args.paylasim)
      .then(tables => {
        let su = tables.su,
          paylasim = tables.paylasim
        let aIsimli = [],
          bIsimli = [],
          aIsimsiz = [],
          bIsimsiz = []

        for (let i = 0; i < su.length; i++) {
          let name = su[i]['2']
          let diffSu = parseInt(su[i]['5'])
          let totalSu = diffSu * args.gazBirim
          let diffKal = parseInt(paylasim[i][3].replace(",", ".")) || 0
          let ortak = parseFloat(paylasim[i][7].replace(",", ".")) || 0
          let totalKal = parseFloat(paylasim[i][8].replace(",", ".")) || 0
          let aidat = 200. - ortak
          let total = Math.ceil(totalSu + totalKal + ortak + aidat)

          let daire = [name, diffSu, totalSu, diffKal, totalKal, ortak, aidat, total]
          let isimsiz = ["NO LU DAIRE", diffSu, totalSu, diffKal, totalKal, ortak, aidat, total]

          if (i < 24) {
            aIsimli.push(daire)
            aIsimsiz.push(isimsiz)
          } else {
            bIsimli.push(daire)
            bIsimsiz.push(isimsiz)
          }
        }

        let title = new Date().getFullYear() + " - "

        let fileName = title + " ISIMLI Aidat"
        this.writeToXlsx(title, aIsimli, bIsimli, fileName)
        fileName = title + " ISIMSIZ Aidat"
        this.writeToXlsx(title, aIsimsiz, bIsimsiz, fileName)

        e.sender.send("apartman-yazdir", "success")
        console.log("Apartman borcu yazdirildi")
      })
  }

  this.printTekilBorc = (e, daire) => {
    this.getTekilBorc(daire)
  }

  this.otoBorclandir = (e, args) => {
    this.calculatePaylasim(e, args)
      .then(paylasimData => {

      })
  }

  this.writeToXlsx = (title, aBlok, bBlok, fileName) => {
    xlsx.fromFileAsync(path.join(__dirname, "aidat", "template", "aidat.xlsx"))
      .then(workbook => {
        // Title
        workbook.sheet(0).cell("C1").value(title)
        workbook.sheet(0).cell("C29").value(title)

        // Values
        workbook.sheet(0).range("B4:I27").value(aBlok)
        workbook.sheet(0).range("B32:I55").value(bBlok)

        workbook.toFileAsync(path.join(__dirname, "aidat", "print", fileName + ".xlsx"))
      })
  }
}

module.exports = Biyos;
