import { template } from "../types";
import { login, initiateNewBrowser } from "../utils";
import axios from "axios";
import * as cheerio from "cheerio";
import * as fs from "fs";

const linkList: template[] = [];
const dlinkList: template[] = [];

const totalPage = 50;
const batchNo = 18;
const getAllLink = async () => {
  let i = totalPage * (batchNo - 1) + 1;
  let baseUrl = "https://slidesgo.com/themes?page";
  do {
    try {
      console.log(
        `Retriving data from ${baseUrl}=${i}`
      );
      const response = await axios.get(`${baseUrl}=${i}`);
      const html = response.data;
      await retrieveSlideLinkFromHtml(html);
      await new Promise((resolve) =>
        setTimeout(resolve, generateRandom() * 1000)
      );
      i = i + 1;
    } catch (e) {
      console.log(e);
      break;
    }
  } while (i < totalPage * batchNo + 1 -26);
};

const retrieveSlideLinkFromHtml = async (html: string) => {
  try {
    const $ = cheerio.load(html);
    $("div.theme_post").each((i, el) => {
      const templateUrl = $(el).find("div>div>div>a").attr("href") ?? "";
      const category = $(el).find("div>a>span").text();
      const name = $(el).find(".text-gray-900").text();

      linkList.push({
        category,
        name: name
          .replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, "")
          .trim(),
        templateUrl,
        downloadUrl: "",
      });
    });
  } catch (error) {
    console.error(error);
  }
};

const exportCSV = (templates: template[]) => {
  const writeStream = fs.createWriteStream(`crawled-data-sg-${batchNo}.csv`);
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
  const writeStream = fs.createWriteStream(`crawled-data-sg-${batchNo}.json`);
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

function generateRandom(min = 2, max = 4) {
  // find diff
  let difference = max - min;

  // generate random number
  let rand = Math.random();

  // multiply with difference
  rand = Math.floor(rand * difference);

  // add with min value
  rand = rand + min;

  return rand;
}

export const scrapeTemplates = async () => {
  await getAllLink();
  // await scrapeAllCategory(linkList);
  //   console.log(`Download links scraping done, total: ${dlinkList.length}`);
  exportCSV(linkList);
  exportJSON(linkList);
};

scrapeTemplates();
