const fetch = require('node-fetch')
const cheerio = require('cheerio')
const fs = require('fs')

// utils  
const getSourceAsText = url => () =>  fetch(url).then(x => x.text())
const scrape = (retrieveSource, parse, persist) => () => 
    retrieveSource()
    .then(parse)
    .then(persist)

const tap = val => {
    console.log(val)
    return val;
}
const pipeAsync = (...fns) => x => fns.reduce(async (prev, f) =>  f(await prev),  x);
const map = fn => ar => ar.map(fn);
const filter = pred => ar => ar.filter(pred);
const logConsole = console.log
const ignore = _ => {}
const writeToJson = fileName => data => fs.writeFileSync(fileName, JSON.stringify(data, null, 2))

// endpoints
const makeUrl = relative => 'https://store.playstation.com' + relative;
const mainPage = makeUrl('/en-no/home/games')

// parses
const parsePlatforms = src =>  {
    const $ = cheerio.load(src);
    return Array.from(cheerio.load(src)('ul:nth-of-type(2)').children('a')).map(el => ({
        platform: $(el).text(),
        link: $(el).attr('href')
    }))
}

const parseGameAndPrice = src => {
    const $ = cheerio.load(src);
    return Array.from($('.grid-cell__body')).map(el => ({
        title: $(el).find('.grid-cell__title > span').attr('title'),
        price: $(el).find('.price-display__price').text()
    }))
}

// scrapes
const getPlatformsFromMain = pipeAsync(
    getSourceAsText(mainPage),
    parsePlatforms,
    tap
)

const getTitlesAndPrices = url => pipeAsync(
    getSourceAsText(url),
    parseGameAndPrice,
    tap,
)

const scrapeAllFirstPages = pipeAsync(
    getPlatformsFromMain,
    platforms => Promise.all(
        platforms
        .map(({platform, link}) => 
            getTitlesAndPrices(makeUrl(link))()
            .then(ret => ({[platform]: ret}))
        )
    ),
    tap,
    writeToJson('firstPageAllPlatforms.json')
)

scrapeAllFirstPages()