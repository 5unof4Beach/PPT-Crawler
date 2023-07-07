require("dotenv").config();
import axios from "axios";
import * as cheerio from "cheerio";
import puppeteer, { Page } from "puppeteer";
import * as fs from "fs";

const baseURL = "https://24slides.com/templates/featured";
const linkList: string[] = [];
const dlinkList: string[] = [];

const getAllLink = async () => {
  let i = 0;
  let nextPage =
    "https://24slides.com/templates/paginate/featured?page=1&offset=0";
  do {
    try {
      i = i + 1;
      console.log(`Retriving data from ${nextPage}`);
      const response = await axios.get(nextPage);
      const { html, pagination_next_page_url } = response.data;
      nextPage = pagination_next_page_url;
      await retrieveSlideLinkFromHtml(html);
    } catch (e) {
      break;
    }
  } while (true);
};

const retrieveSlideLinkFromHtml = async (html: string) => {
  try {
    const $ = cheerio.load(html);
    $("div.card > a").each((i, el) => {
      linkList.push(el.attribs.href);
    });
  } catch (error) {
    console.error(error);
  }
};

const scrapeAllSlideDownloadLink = async (slideLinks: string[]) => {
  let { page, browser } = await initiateNewBrowser();
  await login(page);

  for (let i = 0; i < slideLinks.length; i++) {
    try {
      const url = slideLinks[i];
      await page
        .goto(url, {
          waitUntil: "domcontentloaded",
        })
        .catch((e) => {
          console.log(`${dlinkList.length} download links retrieved`);
          throw e;
        });
      const content = await page.content();
      const $ = cheerio.load(content);
      const downloadLink = $("a.btn-download").attr("href") ?? "";
      console.log(
        `Download link retrieved ${downloadLink} | total: ${
          dlinkList.length + 1
        }`
      );
      if (downloadLink) {
        dlinkList.push(downloadLink);
      } else {
        --i;
      }
    } catch (error) {
      console.log(
        "---------------------- Request timeout creating new browser ----------------------"
      );
      browser.disconnect();
      const newBrowser = await initiateNewBrowser();
      page = newBrowser.page;
      browser = newBrowser.browser;
      await login(page);
      --i;
    }
  }
  await browser.close();
};

const initiateNewBrowser = async () => {
  const browser = await puppeteer.launch({
    headless: true,
  });
  const page = await browser.newPage();
  return { page, browser };
};

const login = async (page: Page) => {
  let successful = false;
  do {
    console.log("----------------------- Loggin in -----------------------");
    await page.goto(baseURL);
    await page.setViewport({ width: 1200, height: 800 });
    await page.waitForSelector(".openLoginCard");
    await page.click(".openLoginCard");
    const $email = await page.waitForSelector("#loginEmail");
    const $password = await page.waitForSelector("#loginPassword");
    const $loginBtn = await page.waitForSelector(".login-btn");

    await $email?.type(process.env.TF_SLIDE_EMAIL ?? "");
    await $password?.type(process.env.TF_SLIDE_PASSWORD ?? "");
    await Promise.all([
      $loginBtn?.click(),
      page.waitForNavigation({ waitUntil: "networkidle0" }),
    ]);
    console.log("Checking");
    const link = await page.$(".openLoginCard");
    successful = link ? false : true;
  } while (!successful);
};

const writeDownloadLinksToFile = (links: string[]) => {
  const writeStream = fs.createWriteStream("Download-Links.txt");
  const pathName = writeStream.path;

  // write each value of the array on the file breaking line
  links.forEach((link: string) => writeStream.write(`${link}\n`));

  // the finish event is emitted when all data has been flushed from the stream
  writeStream.on("finish", () => {
    console.log(`wrote all the array data to file ${pathName}`);
  });

  // handle the errors on the write process
  writeStream.on("error", (err) => {
    console.error(`There is an error writing the file ${pathName} => ${err}`);
  });

  // close the stream
  writeStream.end();
};

(async () => {
  await getAllLink();
  await scrapeAllSlideDownloadLink(linkList);
  console.log(dlinkList, `Total: ${dlinkList.length}`);
  writeDownloadLinksToFile(dlinkList);
})();
