const cookies1668 = require('./1668-cookies.json');

const puppeteer = require("puppeteer");

async function performScraping({url, imageUrl, exchangeRate}){
    if(1==1)
        return {};
    const browser = await puppeteer.launch(
        {
            headless: false,
            defaultViewport: null,
            args: ['--start-maximized'],

        }
    );

    let amazonPr;
    try {
        amazonPr = await amazonPrice(browser, imageUrl);
        amazonPr = (amazonPr * exchangeRate).toFixed(2);
        const productDetails = await scrapeProductPage(browser, url);
        return productDetails;
    }catch (e) {
        console.log(e);
    }
    finally {
        await browser.close();
    }
    return {};
}

async function amazonPrice(browser, imageUrl) //to get product price from amazon using googlelens
{
    const page = await browser.newPage();

    try {
        await page.goto('https://google.co.uk?gl=uk');
        try {
            await page.click('button[id="W0wltc"]') //comment out
        }catch (e){
        }
        await page.click('.Gdd5U');
        await page.waitForTimeout(3000);
        await page.click('input[class="cB9M7"]');
        await page.type('input[class="cB9M7"]', imageUrl);
        await page.click('.Qwbd3');
        await page.waitForTimeout(4000);

        try {
            element = await page.evaluate( () => {
                elements = document.querySelectorAll('span[class="VfPpkd-vQzf8d"]');
                for(element of elements){
                    if(element.textContent === "Reject all" ){
                        window.scrollBy(0, window.innerHeight);
                        element.click();
                    }
                }
            });
            await new Promise((resolve)=> setTimeout(resolve, 4000));
        }catch (e){
            console.error(e);
        }

        const allItems = await page.$$('.G19kAf.ENn9pd')

        let amazonPage;
        for (const item of allItems) {
            try {
                const url = await item.$eval('a[href]', node => node.getAttribute('href'));
                const text = await item.$eval('.fjbPGe', node => node.innerText);
                if (text === 'Amazon UK' && !url.includes('/stores/')) {
                    // if (text.includes('Amazon')) {
                    amazonPage = await browser.newPage();

                    while(true){
                        try {
                            await amazonPage.goto('https://amazon.co.uk/gp/cart/view.html');
                            await new Promise((resolve)=> setTimeout(resolve, 1500));
                            const item = await amazonPage.evaluate(() => {
                                return document.querySelector('a[href="https://www.amazon.co.uk/ref=cs_503_link/"]');
                            });
                            if(!item){
                                break;
                            }
                        }catch (e){
                            break;
                        }
                    }
                    await amazonPage.goto(url);
                    // await page.waitForTimeout(5000); // Using waitForTimeout instead of sleep
                    break;
                }
            } catch (error) {
                continue;
            }
        }
        if(!amazonPage){
            throw new Error('Amazon product not found');
        }
        const isAvailable = await amazonPage.evaluate( () => {
            node = document.querySelector('[data-action="show-all-offers-display"]');
            if(node && node.textContent.trim() == 'Currently unavailable'){
                return false;
            }
            return true;
        });

        if(!isAvailable){
            throw new Error('Amazon product not available');
        }
        const price = await amazonPage.evaluate( () =>{
            priceDiv = document.querySelector('div[id="apex_desktop"]');
            priceStr = priceDiv.querySelector('span[class="a-price-whole"]').textContent.replace('\n','')
            + priceDiv.querySelector('span[class="a-price-fraction"]').textContent;

            return parseFloat(priceStr);
        });

        await amazonPage.close();

        return price;
    } catch (e) {
        console.error(e);
        await page.close();
        throw e;
    }
}

async function scrapeProductPage(browser, pageUrl){
    let page = await browser.newPage();

    pageUrl = pageUrl.split('?')[0] + '?sk=consign';

    const cookiesArray = [];

    for (const [key, value] of Object.entries(cookies1668)) {

        const newObject = {
            name: key,
            value: value,
            domain: '.1688.com',
            path: '/'
        };


        cookiesArray.push(newObject);
    }

    await page.setCookie(...cookiesArray);

    await page.goto(pageUrl, {
        // waitUntil: 'load'
        waitUntil: 'domcontentloaded'
    });


    await page.waitForSelector('span[class="od-pc-offer-tab-item-text"]', {timeout: 50000});

    // await page.evaluate( () => {
    //     elements = document.querySelectorAll('span[class="od-pc-offer-tab-item-text"]');
    //     for (const element of elements){
    //         if(element.textContent === '代发'){
    //             element.click();
    //             break;
    //         }
    //     }
    // });

    await page.evaluate( () => {
        elements = document.querySelectorAll('span[class="od-pc-offer-tab-item-text"]');
        for (const element of elements){
            if(element.textContent === '代发'){
                element.click();
                break;
            }
        }
    });
    await page.waitForSelector('div[role="alertdialog"]', {timeout: 60000});
    await page.$eval('div[role="alertdialog"]', el => el.remove());
    await page.$eval('div[class="next-overlay-wrapper opened"]', el => el.remove());
    await page.evaluate(() => {
        document.body.style.overflow = 'visible';
    });

    await new Promise((resolve)=> setTimeout(resolve, 10000));

    const data = await page.evaluate(() => {
        const title = document.querySelector('div[class="title-text"]')?.textContent;

        const priceContent = document.querySelector('.price-content');
        const priceName = priceContent?.querySelector('.price-name')?.textContent;
        const originalPriceName = priceContent?.querySelector('.original-price-name')?.textContent;

        const priceTextElements = priceContent?.querySelectorAll('.price-text');
        const prices = Array.from(priceTextElements).map(element => element.textContent);

        const originPriceNums = priceContent?.querySelectorAll('.origin-price-wrapper .price-num');
        const originPrices = Array.from(originPriceNums).map(element => element.textContent.trim());

        const unitText = priceContent?.querySelector('.unit-text').textContent;

        const propItems = Array.from(document.querySelectorAll('.prop-item'));

        const items = propItems.map(propItem => {
            const itemName = propItem.querySelector('.prop-name').textContent.trim();
            const itemImgUrl = propItem.querySelector('.prop-img').style.backgroundImage
                .replace(/^url\(["']?/, '')
                .replace(/["']?\)$/, '');

            return {
                itemName,
                itemImgUrl,
            };
        });

        const skuItems = Array.from(document.querySelectorAll('div[class="sku-item-wrapper"]'));

        const skuData = skuItems.map(skuItem => {
            const skuItemName = skuItem.querySelector('.sku-item-name')?.textContent.trim();
            const discountPrice = skuItem.querySelector('.discountPrice-price')?.textContent.trim();
            const skuItemSaleNum = skuItem.querySelector('.sku-item-sale-num')?.textContent.trim();

            return {
                skuItemName,
                discountPrice,
                skuItemSaleNum,
            };
        });

        return {
            title,
            priceName,
            originalPriceName,
            prices,
            originPrices,
            unitText,
            items,
            skuData
        };
    });

    let str = '';

    str = data.skuData[0].skuItemName;
    for(let i=1; i<data.skuData.length; i++){
        str = str + '\n' +data.skuData[i].skuItemName ;
    }

    str = str + '\n' +data.title;
    str = str + '\n' +data.priceName;
    str = str + '\n' +data.originalPriceName;
    str = str + '\n' +data.unitText;

    let translatedLines = await translateTextFromGoogle(browser, str);

    for(let i=0; i<data.skuData.length; i++){
        data.skuData[i].skuItemName = translatedLines[i];
    }

    data.url = pageUrl;
    data.title = translatedLines[data.skuData.length];
    data.priceName = translatedLines[data.skuData.length + 1];
    data.originalPriceName = translatedLines[data.skuData.length + 2];
    data.unitText = translatedLines[data.skuData.length + 3];

    return data;

}

async function translateTextFromGoogle(browser, textToTranslate) {
    try {
        const page = await browser.newPage();
        textToTranslate = textToTranslate.replaceAll('\n', '%0A')
        await page.goto('https://translate.google.co.uk/?sl=zh-CN&tl=en&op=translate&text='+textToTranslate);
        try {
            element = await page.evaluate( () => {
                elements = document.querySelectorAll('span[class="VfPpkd-vQzf8d"]');
                for(element of elements){
                    if(element.textContent === "Reject all" ){
                        window.scrollBy(0, window.innerHeight);
                        element.click();
                    }
                }
            });
            await new Promise((resolve)=> setTimeout(resolve, 2000));
        }catch (e){
            console.error(e);
        }
        await page.waitForSelector('span[class="ryNqvb"]');
        const translatedLines = await page.evaluate( () => {
            lines = document.querySelectorAll('span[class="ryNqvb"]');
            return Array.from(lines).map(e => e.textContent).filter(str=> str!="\n");
        });
        return translatedLines;
    } catch (error) {
        console.error('Translation error:', error);
    }
    return [];
}

module.exports = performScraping;