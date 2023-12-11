const puppeteer = require('puppeteer');
const { translate } = require('free-translate');

async function launchAndSetCookies() {
    try {

        const browser = await puppeteer.launch(
            {
                headless: false,
                defaultViewport: null
            }
        );

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

        const cookies = {
            'cookie2': '104a0dc27df1d92c19f5f1997594ee15',
            't': 'f78b2e125ed08fbdb38d66b550d1bc47',
            '_tb_token_': '711bfee883513',
            'cna': 'c6PMHaiUBwkCAW3GB0Vhn5tU',
            'XSRF-TOKEN': '17129d05-0271-461b-a7f6-21eb773956ea',
            'xlly_s': '1',
            'cookie1': 'WqUNDVgfUjZEgjdAeHflnzulN5ssmCW9uDaXdmSeE3g%3D',
            'cookie17': 'UUphzOvA3RGzsVEBbw%3D%3D',
            'sgcookie': 'E100dhj76fufqF2ZlIc2UwEuJvVOpSVkJQJhhXVixuCgiNYeX1mSgi1wT%2Bvdy0GhDxf7OQkwKMbDtxhLeWaJXhJ%2F0giYZF1S0PBsKDx8IZceKKw%3D',
            'sg': '106',
            'csg': '04f86cef',
            'lid': 'posh111',
            'unb': '2206955801560',
            'uc4': 'nk4=0%40EbL%2BqZphOMFCnqD2ZPvDBUN%2F&id4=0%40U2grF8CMYg6Hz3zPRpoXawSI8kphaiQZ',
            '__cn_logon__': 'true',
            '__cn_logon_id__': 'posh111',
            'ali_apache_track': 'c_mid=b2b-22069558015606e1d8|c_lid=posh111|c_ms=1',
            'ali_apache_tracktmp': 'c_w_signed=Y',
            '_nk_': 'posh111',
            'last_mid': 'b2b-22069558015606e1d8',
            '_csrf_token': '1699628717658',
            '__mwb_logon_id__': 'posh111',
            '_m_h5_tk': '22f2ae0923f372ac9d0d6cb7ab435dab_1699655440808',
            '_m_h5_tk_enc': '5f1c05292443e839dc9ca511eb8f2add',
            'mwb': 'ng',
            'aliwwLastRefresh': '1699073813666',
            'is_identity': 'buyer',
            '_is_show_loginId_change_block_': 'b2b-22069558015606e1d8_false',
            '_show_force_unbind_div_': 'b2b-22069558015606e1d8_false',
            '_show_sys_unbind_div_': 'b2b-22069558015606e1d8_false',
            '_show_user_unbind_div_': 'b2b-22069558015606e1d8_false',
            'tfstk': 'dpik21jGK4z7VSNo5QEW4Ld6FG8An_ZQGXIL9kFeuSPjv4FpPHv3iJbFTMkUtXcYG73pdLaEiR2LUJSUaSW4QRWzLvoLLDcb4yg897F3xvGMHCK9XYM7AlR96hISKYZQboHFyhHSFk6lTd32XM0X0YBy8hXjEioCGyNGdFNExOjQH5kzgXhK08fT_YPcYMP4EOlOuN5KsMw2pm7CRzybn5EFzM-h.',
            'l': 'fBruao9nPYRt2PHkBOfaFurza77OSIRYSuPzaNbMi9fP9wsW5zw1W1FeGUvXC3MNFsMkR3RxBjFXBeYBqBAnnxv9SYRKwbHmnmOk-Wf..',
            'isg': 'BFRUK_BwzUnlu1kOK6MQ-ub8JZLGrXiXBwnj9e414F9j2fQjFr1IJwpT2cnBJLDv',
            '__rn_alert__': 'false',
            'taklid': '54741a6156c34b2b994ef0d87f3b0427'
        };

        const newArray = [];

        for (const [key, value] of Object.entries(cookies)) {
            // Create a new object for each key-value pair
            const newObject = {
                name: key,
                value: value,
                domain: '.1688.com',
                path: '/'
            };

            // Add the new object to the array
            newArray.push(newObject);
        }

        // await page.goto(url, {
        //     // waitUntil: 'load'
        //     waitUntil: 'domcontentloaded'
        // });

        await page.setCookie(...newArray);

        // await page.reload();
        //
        // await page.close();
        //
        // page = await browser.newPage();
        // await page.setDefaultNavigationTimeout(120000);

        let userInputUrl = 'https://detail.1688.com/offer/738746323565.html?spm=a2615.2177701.autotrace-_t_16351492839694_1_0_0_1635150867529.49.d094303erUq9ul';
        userInputUrl = userInputUrl.split('?')[0] + '?sk=consign';

        await page.goto(userInputUrl, {
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

        const data = await page.evaluate(() => {
            const title = document.querySelector('div[class="title-text"]');

            const priceContent = document.querySelector('.price-content');
            const priceName = priceContent.querySelector('.price-name').textContent;
            const originalPriceName = priceContent.querySelector('.original-price-name').textContent;

            const priceTextElements = priceContent.querySelectorAll('.price-text');
            const prices = Array.from(priceTextElements).map(element => element.textContent);

            const originPriceNums = priceContent.querySelectorAll('.origin-price-wrapper .price-num');
            const originPrices = Array.from(originPriceNums).map(element => element.textContent.trim());

            const unitText = priceContent.querySelector('.unit-text').textContent;

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

            const skuItems = Array.from(document.querySelectorAll('.sku-item-wrapper'));

            const skuData = skuItems.map(skuItem => {
                const skuItemName = skuItem.querySelector('.sku-item-name').textContent.trim();
                const discountPrice = skuItem.querySelector('.discountPrice-price').textContent.trim();
                const skuItemSaleNum = skuItem.querySelector('.sku-item-sale-num').textContent.trim();

                // Extract additional data if needed

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

        let res = await translateText(str);

        const splitedArray = res.split('\n');

        for(let i=0; i<data.skuData.length; i++){
            data.skuData[i].skuItemName = splitedArray[i];
        }

        data.title = splitedArray[data.skuData.length];
        data.priceName = splitedArray[data.skuData.length + 1];
        data.originalPriceName = splitedArray[data.skuData.length + 2];
        data.unitText = splitedArray[data.skuData.length + 3];




        // data["priceName"] = await translateText(data["priceName"]);
        // data["originalPriceName"] = await translateText(data["originalPriceName"]);


        while(true){
            await new Promise((resolve)=> setTimeout(resolve, 2000));
        }
        // await browser.close();
    }catch (e){
        console.log(e);
        console.log();
    }
}

async function translateText(textToTranslate) {
    try {
        return await translate(textToTranslate, {
            // from: 'zh-cn',
            to: 'en'
        });
    } catch (error) {
        console.error('Translation error:', error);
    }
    return '';
}

launchAndSetCookies();
