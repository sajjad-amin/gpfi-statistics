const puppeteer = require("puppeteer");
const xml2js = require('xml2js');
const path = require("node:path");
const fs = require("node:fs");
const COOKIE_PATH = path.join(__dirname, 'cookies.json');

async function getUiData(){
    let newCookies = [];
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    // password for the router
    const password = process.env.ROUTER_PASSWORD;

    const page = await browser.newPage();
    // Check if cookies file exists
    if (fs.existsSync(COOKIE_PATH)) {
        const cookies = JSON.parse(fs.readFileSync(COOKIE_PATH, 'utf-8'));
        await page.setCookie(...cookies);
    }
    await page.goto('http://192.168.8.1/#/statistic', {
        waitUntil: 'networkidle2'
    });
    if (await page.$('#login_password') !== null) {
        await page.type('#login_password', password);
        await page.click('#login_btn');
        await page.waitForNavigation({ waitUntil: 'networkidle2' });
        // Save cookies to file after login
        newCookies = await page.cookies();
        // click on the div which has the id first_menu_tools
        await page.click('#first_menu_tools');
        // wait for the page to load
        await page.waitForNavigation({ waitUntil: 'networkidle2' });
        // click on the div which has the id left_menu_statistic
        await page.click('#left_menu_statistic');
    }
    // wait for the table table-content to be loaded
    await page.waitForSelector('table.table-content', { visible: true });

    // Extract data from the usage table
    const trafficData = await page.evaluate(() => {
        const rows = document.querySelectorAll('table.table-content tr');
        const lastCleared = document.querySelector('.tablesBottom div:nth-child(3)')?.innerText.trim() || 'N/A';
        const json = {};

        if (rows.length >= 3) {
            // Row 2: Used data
            const usedCells = rows[1].querySelectorAll('td');
            json["used"] = {
                "current_volume": usedCells[1]?.innerText.trim(),
                "monthly_used": usedCells[2]?.innerText.trim(),
                "total_volume": usedCells[3]?.innerText.trim()
            };

            // Row 3: Duration data
            const durationCells = rows[2].querySelectorAll('td');
            json["duration"] = {
                "current_session": durationCells[1]?.innerText.trim(),
                "monthly_total": durationCells[2]?.innerText.trim(),
                "total_duration": durationCells[3]?.innerText.trim(),
                "last_reset": lastCleared
            };
        }
        return json;
    });
    // Close the browser
    await browser.close();
    // Save cookies to file
    if(newCookies && newCookies.length > 0) {
        fs.writeFileSync(COOKIE_PATH, JSON.stringify(newCookies, null, 2));
    }
    return trafficData;
}

async function getApiData() {
    const trafficStatisticsUrl = "http://192.168.8.1/api/monitoring/traffic-statistics";
    const monthStatisticsUrl = "http://192.168.8.1/api/monitoring/month_statistics";

    try {
        const [res1, res2] = await Promise.all([
            fetch(trafficStatisticsUrl, { headers: { 'Content-Type': 'application/xml' } }),
            fetch(monthStatisticsUrl, { headers: { 'Content-Type': 'application/xml' } })
        ]);

        if (!res1.ok || !res2.ok) {
            throw new Error(`HTTP error: ${res1.status} / ${res2.status}`);
        }

        const xml1 = await res1.text();
        const xml2 = await res2.text();
        const xmlData = (
            xml1.replace(/<\?xml.*?\?>/, '').replace('</response>', '') +
            xml2.replace(/<\?xml.*?\?>/, '').replace('<response>', '')
        );

        const parser = new xml2js.Parser({ explicitArray: false });
        const result = await parser.parseStringPromise(xmlData);

        const r = result.response;

        const used = {
            current_volume: (parseInt(r.CurrentDownload) / 1_000_000_000).toFixed(2) + 'GB',
            monthly_used: (parseInt(r.CurrentMonthDownload) / 1_000_000_000).toFixed(2) + 'GB',
            total_volume: (parseInt(r.TotalDownload) / 1_000_000_000).toFixed(2) + 'GB'
        };

        const duration = {
            current_session: formatDuration(r.CurrentConnectTime),
            monthly_total: formatDuration(r.MonthDuration),
            total_duration: formatDuration(r.TotalConnectTime),
            last_reset: r.MonthLastClearTime
        };

        return { used, duration };
    } catch (err) {
        console.error("Error fetching API data:", err);
        return null;
    }
}

function formatDuration(seconds) {
    const s = parseInt(seconds, 10);
    const days = Math.floor(s / 86400);
    const hours = Math.floor((s % 86400) / 3600);
    const minutes = Math.floor((s % 3600) / 60);
    const secs = s % 60;

    const time = [hours, minutes, secs].map(unit => String(unit).padStart(2, '0')).join(':');
    return days > 0 ? `${days}day ${time}` : time;
}


module.exports = {getUiData, getApiData};