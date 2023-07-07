import { template } from "./types";
import * as fs from "fs";
import { login, initiateNewBrowser } from "./utils";
import { Page } from "puppeteer";
import axios from "axios";
import path from "path";

let downloaded = 0;
const rawTemplates: template[] = require("../../crawled-data.json");
const templates = [
  ...new Map(rawTemplates.map((item) => [item["name"], item])).values(),
];

const total = templates.length;
const middleIndex = Math.ceil(templates.length / 2);

const firstHalf = templates.splice(0, middleIndex);
const secondHalf = templates.splice(-middleIndex);

export const download = async (data: template[]) => {
  let { page, browser } = await initiateNewBrowser();
  await login(page);
  let cookie = await getToken(page);

  for (let i = 0; i < data.length; i++) {
    const templateData: template = data[i];
    try {
      await req(templateData, cookie);
    } catch (error) {
      console.log(error);
      browser.disconnect();
      const newBrowser = await initiateNewBrowser();
      page = newBrowser.page;
      browser = newBrowser.browser;
      await login(page);
      cookie = await getToken(page);
      await req(templateData, cookie);
    }
  }
  return;
};

const req = async (templateData: template, cookie: any) => {
  return axios
    .get(templateData.downloadUrl, {
      headers: {
        Cookie: `${cookie.name}=${cookie.value};`,
      },
      responseType: "stream",
    })
    .then((response) => {
      save(
        response,
        `Downloads/${templateData.category}`,
        `${templateData.name}.pptx`
      )
        .then(() => {
          console.log(
            `File save sucessfully | total: ${++downloaded}/${total}`
          );
          if (downloaded === total) console.log("All templates downloaded");
        })
        .catch((e) => {
          throw e;
        });
    })
    .catch((e) => {
      throw e;
    });
};

const getToken = async (page: Page) => {
  console.log("----------------- Getting token -----------------");
  const cookies = await page.cookies();
  return cookies[0];
};

const save = async (response: any, location: string, name: string) => {
  if (!fs.existsSync(location)) {
    fs.mkdirSync(location, { recursive: true });
  }
  const writer = fs.createWriteStream(path.resolve(`${location}/${name}`));
  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on("finish", resolve);

    writer.on("error", reject);
  });
};

export const downloadAll = async () => {
  download(firstHalf);
  download(secondHalf);
};

downloadAll();
