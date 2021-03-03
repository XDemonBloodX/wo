const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const request = require('request-promise-native');
const poll = require('promise-poller').default;
const apiKey = "e51f051acd2eb41fa5b25556d56680f1";
const dotenv = require('dotenv');
const publicIp = require('public-ip');
const delay = require('delay');
fs = require('fs');

dotenv.config();

const email = process.env.EMAIL;
const password = process.env.PASSWORD;

puppeteer.use(StealthPlugin());
const siteDetails = {
        sitekey: '6Lf9eD8UAAAAABwGRstOAcs_GUcPG3iLExUkauEA',
        pageurl: 'https://serveur-prive.net/minecraft/nationsglory-2867/vote'
    }
    //headless true for hide chromium
const chromeOptions = {
    headless: true,
    slowMo: 100,
    args: [
        "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.182 Safari/537.36"
    ],
    defaultViewport: null
};



//console.log(email, password);
setInterval(async function main() {
    console.log("✨Vote in chargement...✨");

    const browser = await puppeteer.launch(chromeOptions);
    const page = await browser.newPage();
    const page2 = await browser.newPage();
    await page.goto('https://serveur-prive.net/minecraft/nationsglory-2867/vote');
    await page.waitForTimeout(2000);
    page.click(".sd-cmp-1rLJX");

    //NOTE vote
    const requestId = await initiateCaptchaRequest(apiKey);
    const response = await pollForRequestResults(apiKey, requestId);

    //NOTE click for vote
    await page.evaluate(`document.getElementById("g-recaptcha-response").innerHTML="${response}";`);
    page.click('#btnvote[type=submit]');

    await page2.goto('https://nationsglory.fr/vote');
    await page2.waitForTimeout(14000);
    await page2.click('[data-target="#signinModal"]')
    await page2.waitForTimeout(1000);
    await page2.type('[name="email"]', email);

    await page2.waitForTimeout(1000);
    await page2.type('#signin-password', password);

    await page2.waitForTimeout(500);
    await page2.click('.signin-login');
    await page2.waitForTimeout(2000);

    await page2.click('.button-vote');
    await delay(60 * 60)
    await browser.close();

    console.log("✨All done, check the console✨");

    await setTimeout(main, 5400000);

}, 5400000);







//ANCHOR FUNCTION CAPTCHA
async function initiateCaptchaRequest(apiKey) {
    const formData = {
        method: 'userrecaptcha',
        googlekey: siteDetails.sitekey,
        key: apiKey,
        pageurl: siteDetails.pageurl,
        json: 1
    };
    const response = await request.post('http://2captcha.com/in.php', { form: formData });
    return JSON.parse(response).request;
}

async function pollForRequestResults(key, id, retries = 30, interval = 1500, delay = 15000) {
    await timeout(delay);
    return poll({
        taskFn: requestCaptchaResults(key, id),
        interval,
        retries
    });
}

function requestCaptchaResults(apiKey, requestId) {
    const url = `http://2captcha.com/res.php?key=${apiKey}&action=get&id=${requestId}&json=1`;
    return async function() {
        return new Promise(async function(resolve, reject) {
            const rawResponse = await request.get(url);
            const resp = JSON.parse(rawResponse);
            if (resp.status === 0) return reject(resp.request);
            resolve(resp.request);
        });
    }
}


async function testMytime() {
    const monIp = await publicIp.v4();
    const browser = await puppeteer.launch(chromeOptions);
    const page3 = await browser.newPage();
    await page3.goto('https://nationsglory.fr/vote');
    await page3.waitForTimeout(6000);
    await page3.click('[data-target="#signinModal"]')
    await page3.waitForTimeout(1000);
    await page3.type('[name="email"]', email);

    await page3.waitForTimeout(1000);
    await page3.type('#signin-password', password);

    await page3.waitForTimeout(2000);
    await page3.click('.signin-login');
    await page3.waitForTimeout(2000);
    await page3.goto('https://nationsglory.fr/vote?checkvote=' + monIp);
    let delayVote = await page3.evaluate(() => Array.from(document.getElementsByTagName('pre')[0].textContent));

    let damn = "";
    for (let i = 0; i < delayVote.length; i++) {
        damn += delayVote[i]
    }
    damn = JSON.parse(damn);
    console.log("status: " + damn["status"])
    if (!damn["status"]) {
        return 0
    } else {
        return damn["nextvote"]
    }

}

const timeout = millis => new Promise(resolve => setTimeout(resolve, millis))