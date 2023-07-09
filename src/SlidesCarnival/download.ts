import { template } from "../types";
import * as fs from "fs";
import { login, initiateNewBrowser } from "../utils";
import { Page } from "puppeteer";
import axios, { AxiosError } from "axios";
import path from "path";

let downloaded = 0;
const rawTemplates: template[] = require("../../crawled-data-sc.json");
// Remove duplicate data
const templates = [
  ...new Map(rawTemplates.map((item) => [item["name"], item])).values(),
];

const total = templates.length;
const middleIndex = Math.ceil(templates.length / 2);

// Split data into 2 halves so as not to get blocked
const firstHalf = templates.splice(0, middleIndex);
const secondHalf = templates.splice(-middleIndex);

export const download = async (data: template[]) => {
  for (let i = 0; i < data.length; i++) {
    const templateData: template = data[i];
    try {
      await req(templateData);
    } catch (error: AxiosError | any) {
      console.log(error, templateData.templateUrl);
      if (axios.isAxiosError(error)) {
        // Access to config, request, and response
        if (error.response?.status != 404) await req(templateData);
      } else {
        // Just a stock error
      }
    }
  }
  return;
};

const req = async (templateData: template) => {
  return axios
    .get(templateData.downloadUrl, {
      responseType: "stream",
    })
    .then((response) => {
      save(
        response,
        `Downloads-sc/${templateData.category}`,
        `${templateData.name}.pptx`
      )
        .then(() => {
          console.log(
            `File save sucessfully | total: ${++downloaded}/${total}`
          );
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
  await Promise.all([download(firstHalf), download(secondHalf)]);
  console.log(downloaded, "All templates downloaded");
};

downloadAll();
