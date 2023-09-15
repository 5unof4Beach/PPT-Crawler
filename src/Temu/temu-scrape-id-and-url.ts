import { initiateNewBrowser, randomNumber, wait } from "./utils";
import { GeneralInfo } from "./types";
import axios from "axios";
import * as cheerio from "cheerio";
import * as fs from "fs";

const linkList: string[] = [];
const dlinkList: GeneralInfo[] = [];

const getAllLink = async () => {
  //Get all template data from main page
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

const scrape = async () => {
  let { page, browser } = await initiateNewBrowser();
  await scrapeIdsAndProductUrls(page);
};

const removeScrapedElements = async (page: any) => {
  await page.evaluate(() => {
    const elementsToRemove = document.querySelectorAll(".crawled");
    elementsToRemove.forEach((element: any) => element.remove());
  });
};

const scrapeIdsAndProductUrls = async (page: any) => {
  const baseURL =
    "https://www.temu.com/home-kitchen-o3-36.html?opt_level=1&title=Home%20%26%20Kitchen&_x_enter_scene_type=cate_tab&leaf_type=son&show_search_type=3&_x_sessn_id=sjj71r67x1&refer_page_name=home&refer_page_id=10005_1694789023211_trtu3mn754&refer_page_sn=10005&filter_items=3%3A1";
  await page.goto(baseURL, {
    waitUntil: "domcontentloaded",
  });

  let i = 20;
  while (i !== 0) {
    await page.mouse.wheel({ deltaY: 500 });
    const showMoreBtn = await page.waitForSelector("._2U9ov4XG", {
      visible: true,
      timeout: 5000,
    });
    const productCards = await page.$$("._3GizL2ou");
    while (productCards.length === 0) await showMoreBtn.click();
    for (const el of productCards) {
      await el.evaluate((el: any) => {
        el.classList.remove("_3GizL2ou");
        el.classList.add("crawled");
      });
    }

    await removeScrapedElements(page);
    console.log("done " + i + " amount of items: " + productCards.length);
    await showMoreBtn.click();
    await wait(randomNumber(20000, 25000));
    i--;
  }
};

const exportCSV = (templates: GeneralInfo[]) => {
  const writeStream = fs.createWriteStream("crawled-data.csv");
  const pathName = writeStream.path;

  //Generate header
  writeStream.write(`category,name,templateUrl,downloadUrl\n`);
  //Write data
  templates.forEach((template: GeneralInfo) => {
    const { category, name, id, productUrl } = template;
    writeStream.write(
      `${category.replace(/\,/g, "")},${name.replace(
        /\,/g,
        ""
      )},${id},${productUrl}\n`
    );
  });

  writeStream.on("finish", () => {
    console.log(`wrote all the array data to file ${pathName}`);
  });

  writeStream.on("error", (err) => {
    console.error(`There is an error writing the file ${pathName} => ${err}`);
  });

  writeStream.end();
};

const exportJSON = (templates: GeneralInfo[]) => {
  const writeStream = fs.createWriteStream("crawled-data.json");
  const pathName = writeStream.path;

  writeStream.write(JSON.stringify(templates));

  writeStream.on("finish", () => {
    console.log(`wrote all the array data to file ${pathName}`);
  });

  writeStream.on("error", (err) => {
    console.error(`There is an error writing the file ${pathName} => ${err}`);
  });

  writeStream.end();
};

export const scrapeTemplates = async () => {
  await scrape();
  // console.log(`Download links scraping done, total: ${dlinkList.length}`);
  // exportCSV(dlinkList);
  // exportJSON(dlinkList);
};
