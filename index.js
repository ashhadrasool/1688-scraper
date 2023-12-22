const puppeteer = require('puppeteer');
const { Piscina } = require('piscina');
const path = require('path');
const cookies1668 = require('./1668-cookies.json');
const csv = require('csv-parser');
const fs = require('fs');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const csvFilePath = './output.csv'

async function launchAndSetCookies() {
    let data;
    try {

        const browser = await puppeteer.launch(
            {
                headless: false,
                defaultViewport: null,
                args: ['--start-maximized'],

            }
        );

        let exchangeRate = await fetchExchangeRate(browser, 1);
        console.log("exchangeRate", exchangeRate);

        let page = await browser.newPage();
        const url = 'https://1688.com';

        await page.setRequestInterception(true);

        // Intercept requests
        page.on('request', (request) => {
            if (request.resourceType() === 'image' && !request.url().includes('https://gw.alicdn.com/')) {
                request.abort(); // Block image requests
            } else {
                request.continue(); // Allow other requests
            }
        });

        await page.setDefaultNavigationTimeout(120000);

        const newArray = [];

        for (const [key, value] of Object.entries(cookies1668)) {
            const newObject = {
                name: key,
                value: value,
                domain: '.1688.com',
                path: '/'
            };
            newArray.push(newObject);
        }
        await page.setCookie(...newArray);

        let userInputUrl = 'https://pintimewatchs.1688.com/page/offerlist.htm?spm=0.0.wp_pc_common_topnav_38229151.0';

        await page.goto(userInputUrl, {
            waitUntil: 'load'
            // waitUntil: 'networkidle2'
        });

        // const images = await page.$$('[class="main-picture"]');
        const imageUrls = await page.evaluate(() => {
            urls = [];
            elements = document.querySelectorAll('img[class="main-picture"]');
            elements.forEach(element => {
                if(element.getAttribute('src').includes('//cb')){
                    urls.push('https:'+element.getAttribute('src'));
                    element.click();
                }
            });
            return urls;
            // return Array.from(document.querySelectorAll('img[class="main-picture"]'))
            //     .filter(e=>e.getAttribute('src').includes('//cb'));
            // const urls = elements.map(e=> 'https:'+e.getAttribute('src'))
        });
        await new Promise((resolve)=> setTimeout(resolve, 3000));

        const allPages = await browser.pages();
        let productUrls = [];
        for (let i = 2; i < allPages.length; i++) {
            const url = allPages[i].url();
            productUrls.push(url);
            await allPages[i].close();
        }

        const piscina = new Piscina({
            minThreads: 1,
            maxThreads: 1,
        });
        const options = {
            filename: path.resolve(__dirname, 'detail-page-scrapper.js')
        }

        let headers = [];
        // let csvHeaders = [];
        if(fs.existsSync(csvFilePath)){
            const readStream = fs.createReadStream(csvFilePath);
            readStream
                .pipe(csv())
                .on('headers', (h) => {
                    headers = h;
                })
        }

        let promises = []
        for(let i=0; i<imageUrls.length; i++){
            if(!imageUrls[i]){
                continue;
            }
            promises.push(
                piscina.run({url: productUrls[i], imageUrl: imageUrls[i], exchangeRate}, options)
                    .then( (res) => {
                        console.log('res', JSON.stringify(res));
                        return res;
                    })
                    .then( async (res)=> {
                        res = {"title":"Pintime/During the product, quartz watch men's watch foreign trade cross -border explosion wine barrel square watch multifunctional Miller watch men","priceName":"price","prices":["78.00"],"originPrices":[],"unitText":"1 starting","items":[],"skuData":[{"skuItemName":"Red belt silver shell","discountPrice":"78.00元","skuItemSaleNum":"7151 个可售"},{"skuItemName":"Red belt rose shell","discountPrice":"78.00元","skuItemSaleNum":"8126个可售"},{"skuItemName":"Black belt silver shell","discountPrice":"78.00元","skuIte mSaleNum":"6985个可售"},{"skuItemName":"Black belt rose shell","discountPrice":"78.00元","skuItemSaleNum":"7526个可售"},{"skuItemName":"Black shell","discountPrice":"78.00元","s kuItemSaleNum":"8583个可售"},{"skuItemName":"Red belt black shell","discountPrice":"78.00元","skuItemSaleNum":"8637个可售"}],"url":"https://detail.1688.com/offer/623927408071.html?sk=consign","originalPriceName":"undefined"};


                        // const objectKeys = Object.keys(res);
                        const objectKeys = [
                            "title",
                            "skuTitle",
                            "price",
                            "discountedPrice"
                        ]

                        let newHeaders = false;
                        objectKeys.forEach(k => {
                            if(!headers.includes(k)){
                                headers.push(k);
                                newHeaders = true;
                            }
                        })

                        const csvHeaders = headers.map( key => {
                            return {
                                id: key,
                                title: key
                            }
                        });

                        let csvWriter = undefined;
                        if(!fs.existsSync(csvFilePath) || newHeaders){
                            const oldData = [];
                            csvWriter = createCsvWriter({
                                path: csvFilePath,
                                header: csvHeaders,
                            });
                            if(fs.existsSync(csvFilePath)){
                                const readStream = fs.createReadStream(csvFilePath);
                                readStream
                                    .pipe(csv())
                                    .on('data',  (row) => {
                                        oldData.push(row);
                                    });

                                oldData.forEach( (row) => {
                                    csvWriter.writeRecords(row);
                                });
                            }
                        }else{
                            csvWriter = createCsvWriter({
                                path: csvFilePath,
                                header: csvHeaders,
                                append: true,
                            });
                        }

                        data = [res];

                        await csvWriter.writeRecords(data)
                            .then(() => {
                                console.log('CSV file has been written');
                            })
                            .catch((error) => {
                                console.error(error);
                            });
                        // sqLiteDatabase.updateTable('scraper_jobs',{done: 1}, {url});
                        console.log(`Scrapped job ${i+1}: ${url}`);
                    }
                ).catch(e => console.log('error in scrapping:', url, e))

            );
        }
        const results = await Promise.all(promises);

        while(true){
            await new Promise((resolve)=> setTimeout(resolve, 2000));
        }
        // await browser.close();
    }catch (e){
        console.log(e);
        console.log();
    }
}

async function fetchExchangeRate(browser, amount){
    page = await browser.newPage();
    await page.goto(`https://www.google.co.uk/search?q=${amount}+pounds+to+eur`);
    const exhangeRate = await page.$eval('div[data-exchange-rate]', element => element.getAttribute('data-exchange-rate'));
    await page.close();
    return exhangeRate;
}

launchAndSetCookies();
