const puppeteer = require('puppeteer');
const { Piscina } = require('piscina');
const path = require('path');
const cookies1668 = require('./1668-cookies.json');

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

        let promises = []
        for(let i=0; i<imageUrls.length; i++){
            if(!imageUrls[i]){
                continue;
            }
            promises.push(
                (piscina.run({url: productUrls[i], imageUrl: imageUrls[i], exchangeRate}, options).then( async (res) => {
                    console.log('res', res);
                }))
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
