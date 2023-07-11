import puppeteer from "puppeteer";

const connect = async () => {
  const browserURL = "http://127.0.0.1:21222";
  const browser = await puppeteer.connect({ browserURL });
  const page = await browser.newPage();
  await page.goto("https://slidesgo.com/education?order=popular#rs=menu");
  await page.setViewport({ width: 1920, height: 1080 });
  const selectors = await page.$$("div.theme_post");
  console.log(selectors.length);
  for (const card of selectors) {
    const btns = await card.$$(".tooltip-group");
    if (btns.length === 3) {
      await btns[2]?.click();
    } else {
      await btns[1]?.click();
    }
    await new Promise((resolve) =>
      setTimeout(resolve, generateRandom() * 1000)
    );
    console.log("clicked");
  }
};

const collect = () => {
  const amount = 100;
  const baseURL = 'https://slidesgo.com/themes?page='
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

connect();
