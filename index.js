const puppeteer = require('puppeteer');
const { Piscina } = require('piscina');
const path = require('path');

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

        let exhangeRate = await fetchExchangeRate(browser, 1);
        console.log("exhangeRate", exhangeRate);

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

        const cookies= {
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
            // waitUntil: 'load'
        });

        // const images = await page.$$('[class="main-picture"]');
        const urls = await page.evaluate(() => {
            elements = Array.from(document.querySelectorAll('img[class="main-picture"]'))
                .map(e=> 'https:'+e.getAttribute('src'))
                .filter(e=>e.includes('//cb'));
            return elements;
        });

        const piscina = new Piscina({
            filename: path.resolve(__dirname, 'detail-page-scrapper.js'),
            minThreads: 1,
            maxThreads: 1,
        });

        let promises = []
        for(let i=0; i<urls.length; i++){
            if(!urls[i]){
                continue;
            }
            promises.push(
                piscina.runTask(urls[i]).then( r=> {
                    console.log(r);
                })
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
    await page.goto(`https://www.google.com/search?q=${amount}+pounds+to+eur`);
    const exhangeRate = await page.$eval('div[data-exchange-rate]', element => element.getAttribute('data-exchange-rate'));
    await page.close();
    return exhangeRate;
}

launchAndSetCookies();
