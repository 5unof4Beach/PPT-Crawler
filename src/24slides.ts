require("dotenv").config();
import axios from "axios";
import * as cheerio from "cheerio";
import puppeteer from "puppeteer";
const fs = require("fs");

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
  } while (i < 1);
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
  const browser = await puppeteer.launch({
    headless: false,
    userDataDir: "./user-data-dir",
  });
  const page = await browser.newPage();
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
      dlinkList.push(downloadLink);
    } catch (error) {
      console.error(error);
      continue;
    }
  }

  await browser.close();
};

(async () => {
  await getAllLink();
  await scrapeAllSlideDownloadLink(linkList);
  console.log(dlinkList, `Total: ${dlinkList.length}`);
  // await downloadFiles(dlinkList)
})();
