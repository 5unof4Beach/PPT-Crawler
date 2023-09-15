require("dotenv").config();
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

// import puppeteer, { Page } from "puppeteer";
puppeteer.use(StealthPlugin());

export const initiateNewBrowser = async () => {
  const browserURL = "http://127.0.0.1:9222";
  const browser = await puppeteer.launch({
    args: ["--incognito"],
    headless: false,
  });

  // const browser = await puppeteer.connect({browserURL});
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await login(page);
  return { page, browser };
};

export const login = async (page: any) => {
  let successful = false;
  // Navigate to the website with the Google login popup
  await page.goto("https://www.temu.com/login.html?login_scene=8", {
    waitUntil: "domcontentloaded",
  });

  // Wait for the login button to appear
  await page.waitForSelector(".container-ja9M1");

  // Wait for the login button to appear
  const buttons = await page.$$(".container-ja9M1");

  // Click on the login button to open the Google login popup
  await buttons[0].click();

  // Wait for the Google login popup to appear
  await page.waitForSelector('iframe[src*="accounts.google.com"]');

  // Get the Google login iframe
  const googleLoginFrame = page
    .frames()
    .find((frame: any) => frame.url().includes("accounts.google.com"));

  // Interact with the elements in the Google login iframe
  await googleLoginFrame.waitForSelector('input[type="email"]');
  await googleLoginFrame.type(
    'input[type="email"]',
    "duc.bui.reserved@gmail.com"
  );
  await googleLoginFrame.click("#identifierNext");

  await googleLoginFrame.waitForSelector('input[type="password"]');
  await googleLoginFrame.type('input[type="password"]', "Buiminhduc2001");
  await googleLoginFrame.click("#passwordNext");

  // Wait for the login process to complete (adjust this wait time based on your specific scenario)
  await page.waitForTimeout(5000);

  // Continue interacting with the website after logging in
  // ...

  // await browser.close();
};
