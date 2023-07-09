import { template } from "../types";
import { login, initiateNewBrowser } from "../utils";
import axios from "axios";
import * as cheerio from "cheerio";
import * as fs from "fs";

const linkList: template[] = [];
const dlinkList: template[] = [];

const getTotalPage = async () => {
  const response = await axios.get(
    "https://www.slidescarnival.com/category/free-templates/page/1"
  );
  try {
    const $ = cheerio.load(response.data);
    const el = $("div.archive-pagination > ul > li:nth-last-child(2) > a");
    return parseInt(el.contents().last().text().trim());
  } catch (error) {
    console.error(error);
  }
};

const getAllLink = async () => {
    const totalPage = (await getTotalPage()) ?? 0;
//   const totalPage = 1;
  let i = 1;
  let baseUrl = "https://www.slidescarnival.com/category/free-templates/page";
  do {
    try {
      console.log(`Retriving data from ${baseUrl}/${i}`);
      const response = await axios.get(`${baseUrl}/${i}`);
      const html = response.data;
      await retrieveSlideLinkFromHtml(html);
      i = i + 1;
    } catch (e) {
      break;
    }
  } while (i < totalPage + 1);
};

const retrieveSlideLinkFromHtml = async (html: string) => {
  try {
    const $ = cheerio.load(html);
    $("article.card-template .sc-powerpoint").each((i, el) => {
      const parent = el.parentNode?.parentNode?.parentNode ?? el;
      const card = $(parent).find("h2.card-title>a");
      const downloadUrl = el.attribs.href;
      const templateUrl = card.attr("href") ?? `template${i}`;
      const name = card.text();

      linkList.push({
        category: "",
        name: name.replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, ""),
        templateUrl,
        downloadUrl,
      });

      console.log(card.attr("href"));
    });
  } catch (error) {
    console.error(error);
  }
};

const scrapeAllCategory = async (slideLinks: template[]) => {
  const total = slideLinks.length;

  for (let i = 0; i < total; i++) {
    try {
      const slide = slideLinks[i];
      const content = await axios.get(slide.templateUrl);
      const $ = cheerio.load(content.data);
      const category = $("p#breadcrumbs > span > span:nth-child(3) > a");
      const categoryName = category.text() ? category.text() : "Other";
      console.log(`Category retrieved ${categoryName}| total:${i+1}/${total}`);
      dlinkList.push({
        ...slide,
        category: categoryName,
      });
    } catch (error) {
      // Create new browser after current browser got blocked
      console.log(
        "---------------------- Request timeout ----------------------"
      );
      --i;
    }
  }
};

const exportCSV = (templates: template[]) => {
  const writeStream = fs.createWriteStream("crawled-data-sc.csv");
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
  const writeStream = fs.createWriteStream("crawled-data-sc.json");
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
  await scrapeAllCategory(linkList);
  //   console.log(`Download links scraping done, total: ${dlinkList.length}`);
  exportCSV(dlinkList);
  exportJSON(dlinkList);
};

scrapeTemplates();
