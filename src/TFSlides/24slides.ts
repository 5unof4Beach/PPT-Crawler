import { template } from "../types";
import { login, initiateNewBrowser } from "../utils";
import axios from "axios";
import * as cheerio from "cheerio";
import * as fs from "fs";
import { downloadAll } from "./download";

const linkList: string[] = [];
const dlinkList: template[] = [];

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

const scrapeAllSlideDownloadLink = async (slideLinks: string[]) => {
  const total = slideLinks.length;
  let { page, browser } = await initiateNewBrowser();
  await login(page);

  for (let i = 0; i < total; i++) {
    try {
      const url = slideLinks[i];
      await page
        .goto(url, {
          waitUntil: "domcontentloaded",
        })
        .catch((e) => {
          //throw error case of timeout
          console.log(`${dlinkList.length} download links retrieved`);
          throw e;
        });
      const content = await page.content();
      const $ = cheerio.load(content);
      const downloadLink = $("a.btn-download").attr("href") ?? "";
      const category =
        $("ol.breadcrumb-menu > li:nth-child(2) span").text() ?? "";
      const name = $("ol.breadcrumb-menu > li:nth-child(3) span").text() ?? "";
      console.log(
        `Download link retrieved ${downloadLink} | total: ${
          dlinkList.length + 1
        }/${total}`
      );
      if (downloadLink) {
        dlinkList.push({
          category,
          name: name.replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, ""),
          templateUrl: slideLinks[i],
          downloadUrl: downloadLink,
        });
      } else {
        --i;
      }
    } catch (error) {
      // Create new browser after current browser got blocked
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

const exportCSV = (templates: template[]) => {
  const writeStream = fs.createWriteStream("crawled-data.csv");
  const pathName = writeStream.path;

  //Generate header
  writeStream.write(`category,name,templateUrl,downloadUrl\n`);
  //Write data
  templates.forEach((template: template) => {
    const { category, name, templateUrl, downloadUrl } = template;
    writeStream.write(
      `${category.replace(/\,/g, "")},${name.replace(
        /\,/g,
        ""
      )},${templateUrl},${downloadUrl}\n`
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

const exportJSON = (templates: template[]) => {
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
  await getAllLink();
  await scrapeAllSlideDownloadLink(linkList);
  console.log(`Download links scraping done, total: ${dlinkList.length}`);
  exportCSV(dlinkList);
  exportJSON(dlinkList);
};
