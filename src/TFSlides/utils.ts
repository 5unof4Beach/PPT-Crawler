require("dotenv").config();
import puppeteer, { Page } from "puppeteer";
const baseURL = "https://24slides.com/templates/featured";

export const initiateNewBrowser = async () => {
    const browser = await puppeteer.launch({
      headless: true,
    });
    const page = await browser.newPage();
    return { page, browser };
  };
  
  export const login = async (page: Page) => {
    let successful = false;
    do {
      // Retry login if login button still exists
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
      console.log("Checking if login is successful");
      const link = await page.$(".openLoginCard");
      successful = link ? false : true;
    } while (!successful);
  };