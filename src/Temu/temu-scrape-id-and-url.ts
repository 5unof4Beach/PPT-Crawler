import { initiateNewBrowser } from "./utils";
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

const scrape = async (slideLinks: string[]) => {
  const total = slideLinks.length;
  let { page, browser } = await initiateNewBrowser();
  // await login(page);

  // await scrapeIdsAndProductUrls(page);

  // for (let i = 0; i < total; i++) {
  //   try {
  //     const url = slideLinks[i];
  //     await page
  //       .goto(url, {
  //         waitUntil: "domcontentloaded",
  //       })
  //       .catch((e) => {
  //         //throw error case of timeout
  //         console.log(`${dlinkList.length} download links retrieved`);
  //         throw e;
  //       });
  //     const content = await page.content();
  //     const $ = cheerio.load(content);
  //     const downloadLink = $("a.btn-download").attr("href") ?? "";
  //     const category =
  //       $("ol.breadcrumb-menu > li:nth-child(2) span").text() ?? "";
  //     const name = $("ol.breadcrumb-menu > li:nth-child(3) span").text() ?? "";
  //     console.log(
  //       `Download link retrieved ${downloadLink} | total: ${
  //         dlinkList.length + 1
  //       }/${total}`
  //     );
  //     if (downloadLink) {
  //       dlinkList.push({
  //         category,
  //         name: name.replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, ""),
  //         id: slideLinks[i],
  //         productUrl: downloadLink,
  //       });
  //     } else {
  //       --i;
  //     }
  //   } catch (error) {
  //     // Create new browser after current browser got blocked
  //     console.log(
  //       "---------------------- Request timeout creating new browser ----------------------"
  //     );
  //     browser.disconnect();
  //     const newBrowser = await initiateNewBrowser();
  //     page = newBrowser.page;
  //     browser = newBrowser.browser;
  //     await login(page);
  //     --i;
  //   }
  // }
  // await browser.close();
};

const removeScrapedElements = async (page: any) => {
  await page.evaluate(() => {
    const elementsToRemove = document.querySelectorAll('.crawled');
    elementsToRemove.forEach((element: any) => element.remove());
  });
};

const scrapeIdsAndProductUrls = async (page: any) => {
  const baseURL =
    "https://www.temu.com/home-kitchen-o3-36.html?opt_level=1&title=Home%20%26%20Kitchen&_x_enter_scene_type=cate_tab&leaf_type=son&show_search_type=3&refer_page_el_sn=200053&refer_page_name=home&refer_page_id=10005_1694697438760_2ay7esmmo1&refer_page_sn=10005&_x_sessn_id=u8wkv0rnhx&filter_items=3%3A1";
  await page.goto(baseURL, {
    waitUntil: "domcontentloaded",
  });

  let i = 2;
  while (i !== 0) {
    const showMoreBtn = await page.waitForSelector("._2U9ov4XG", {
      visible: true,
      timeout: 5000,
    });
    const productCards = await page.$$("._3GizL2ou");
    for (const el of productCards) {
      await el.evaluate((el: any) => {
        el.classList.remove("_3GizL2ou");
        el.classList.add("crawled");
      });
    }

    await removeScrapedElements(page);
    console.log('done')
    await showMoreBtn.click();

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
  await scrape(linkList);
  // console.log(`Download links scraping done, total: ${dlinkList.length}`);
  // exportCSV(dlinkList);
  // exportJSON(dlinkList);
};
