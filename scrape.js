const scrape = require('website-scraper');
const fs = require('fs');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const websites = require('./sites.json');
const PuppeteerPlugin = require('website-scraper-puppeteer');

const readSiteDivs = async (file, querySelector) => {
  const websiteFile = await fs.readFileSync(`scraped/${file}`, 'utf8');
  const { window } = new JSDOM(websiteFile);
  const hasStock = window.document.querySelectorAll(querySelector).length !== 0;
  return hasStock;
}

const readMapped = async (mapped, querySelector) => {
  return await Promise.all(mapped.map(async(singleFile) => {
    const hasStock = await readSiteDivs(singleFile.filename, querySelector);
    const stockStatus = { name: singleFile.name, url: singleFile.url, status: false };
    if (hasStock) {
      stockStatus.status = true;
    }
    return stockStatus;
  }));
}

module.exports.doScrape = async () => {

  // delete scraped directory..
  await fs.rmdirSync('scraped', { recursive: true });

  // begin scraping from the array of sites
  return await Promise.all(websites.map(async(singleSite) => {

    const excludedFileTypes = ['png','gif','jpg','jpeg','svg','eot','woff2','eot','woff','ttf','ico','css','webp'];
    const scrapeOptions = {
      urls: singleSite.urls,
      directory: 'scraped',
      ignoreErrors: true,
      urlFilter: (url) => {
        let valid = true;
        excludedFileTypes.map((fileType) => {
          if (url.includes(`.${fileType}`)) {
            valid = false;
          }
        });
        return valid;
      },
      plugins: [ new PuppeteerPlugin({ launchOptions: { headless: true }, blockNavigation: false }) ],
    };

    const mappedScrape = await scrape(scrapeOptions)
      .map((singleResult) => {
        return {
          name: singleSite.name,
          url: singleResult.url,
          filename: singleResult.filename
        };
      });

    const toReturn = await readMapped(mappedScrape, singleSite.divsToSearch);
    return Promise.resolve(toReturn);
  }));
}