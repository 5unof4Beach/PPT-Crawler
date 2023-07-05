import axios from "axios";
import * as cheerio from "cheerio";
import puppeteer from "puppeteer";
const fs = require("fs");

const baseURL = "https://24slides.com/templates/featured";
const linkList: string[] = [];
const dlinkList: string[] = [];

const getAllLink = async () => {
  //   let i = 0;
  let nextPage =
    "https://24slides.com/templates/paginate/featured?page=2&offset=12";
  do {
    try {
      //   i = i + 1;
      console.log(`Retriving data from ${nextPage}`)
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
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(baseURL);
  await page.setViewport({ width: 1080, height: 1024 });
  await page.waitForSelector(".openLoginCard");
  await page.click(".openLoginCard");
  slideLinks.map((url) => {});
};

(async () => {
  await getAllLink();
  console.log(linkList, `Total: ${linkList.length}`);
  // await downloadLinks(linkList)
  // await downloadFiles(dlinkList)
})();
