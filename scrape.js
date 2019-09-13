const fetch = require('node-fetch')
const cheerio = require('cheerio')
const fs = require('fs')

// utils  
const getSourceAsText = url => () =>  fetch(url).then(x => x.text())
const scrape = (retrieveSource, parse, persist) => () => 
    retrieveSource()
    .then(parse)
    .then(persist)

const logConsole = console.log
const ignore = _ => {}
const writeToJson = fileName => data => fs.writeFileSync(fileName, JSON.stringify(data, null, 2))

// endpoints
const mainPage = 'https://store.playstation.com/en-no/home/games';

// parses
const retrievePlatforms = src => 
    Array.from(cheerio.load(src)('ul:nth-of-type(2)').children('a'))
    .map(x => x.firstChild.data)

const retrievePlatformAndPrice = src => {
    const $ = cheerio.load(src);
    return Array.from($('.grid-cell__body')).map(el => ({
        title: $(el).find('.grid-cell__title > span').attr('title'),
        price: $(el).find('.price-display__price').text()
    }))
}

// scrapes
const getPlatforms = scrape(
    getSourceAsText(mainPage),
    retrievePlatforms,
    writeToJson('platforms2.json')
)

const getTitlesAndPrices = scrape(
    getSourceAsText('https://store.playstation.com/en-no/grid/STORE-MSF75508-PS4CAT/1'),
    retrievePlatformAndPrice,
    writeToJson('ps4games.json')
)


getTitlesAndPrices()