require("dotenv").config();
const moment = require("moment");
const puppeteer = require("puppeteer");

const getRandomNumber = (min, max) => {
  min = Math.ceil(min);
  max = Math.floor(max);

  return Math.floor(Math.random() * (max - min + 1)) + min;
};

(async () => {
  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 800 });
    await page.goto(process.env.WEBSITE_URL);

    const $username = await page.waitForSelector("#username");
    const $password = await page.waitForSelector("#password");
    await $username.type(process.env.USERNAME);
    await $password.type(process.env.PASSWORD);
    (await page.$(".login-button")).click();
    await page.waitForNavigation();

    console.log("login success");

    console.log("open monthly view modal");
    console.log("-------------------------------");

    (await page.$("#work-condition-page a")).click();
    await page.waitForNavigation();

    const $attendanceTable = await page.waitForSelector(
      "#attendance-table-body"
    );
    const $$entryButtons = await $attendanceTable.$$(".btnOpen--S");
    await $$entryButtons[0].click();

    const modalSelector = "#daily-detail-body";
    const currentDateSelector = "#current-date";
    const dateFormat = "YYYY/MM/DD";

    await page.waitForSelector(modalSelector);

    let currentDateStr = await page.$eval(
      currentDateSelector,
      (el) => el.innerText
    );
    const lastDayOfMonthMoment = moment(currentDateStr, dateFormat).endOf(
      "month"
    );

    do {
      console.log(`evaluate ${currentDateStr}`);
      const $modal = await page.waitForSelector(modalSelector);

      const isDayDisabled = await page.$eval(
        "#work-time-in",
        (el) => el.disabled
      );

      if (!isDayDisabled) {
        console.log("start fill weekdays");
        const emotions = [1, 1, 1, 3, 2, 2, 2, 3];
        const dateValue = {
          workTimeIn: `09:${getRandomNumber(50, 55)}`,
          workTimeOut: `19:${String(getRandomNumber(0, 10)).padStart(2, "0")}`,
          clockInEmotion: emotions[getRandomNumber(0, emotions.length - 1)],
          clockOutEmotion: emotions[getRandomNumber(0, emotions.length - 1)],
        };
        console.log("decide work time: ", dateValue);
        await (await $modal.$("#work-time-in")).type(dateValue.workTimeIn);
        await (await $modal.$("#work-time-out")).type(dateValue.workTimeOut);
        await (await $modal.$(".break-time-input.work-time-in")).type("13:00");
        await (await $modal.$(".break-time-input.work-time-out")).type("14:00");
        await (await $modal.$$(".formsPulldown--cico"))[0].click();
        await (
          await $modal.$(
            `.clock-in-emotions-class li:nth-child(${dateValue.clockInEmotion})`
          )
        ).click();
        await (await $modal.$$(".formsPulldown--cico"))[1].click();
        await (
          await $modal.$(
            `.clock-out-emotions-class li:nth-child(${dateValue.clockOutEmotion})`
          )
        ).click();
        await page.select("#arriveAtWorkId", "3");
      } else {
        console.log("skip filling due to day off or already filled");
      }

      console.log("send request");
      await (await $modal.$("#request-approval-all")).click();
      // await (await $modal.$('#detail-batch-cancel')).click();

      console.log("go to next day");
      await page.waitForSelector(
        "#monthly-view-attendance-content .disable-modal-sm",
        { hidden: true }
      );
      const $nextButton = await page.waitForSelector("#next-button button", {
        visible: true,
      });
      await $nextButton.click();

      await page.waitForSelector(modalSelector);

      currentDateStr = await page.$eval(
        currentDateSelector,
        (el) => el.innerText
      );

      console.log("-------------------------------");
    } while (
      moment(currentDateStr, dateFormat).isBefore(moment(), "day") ||
      (moment(currentDateStr, dateFormat).isSame(moment(), "day") &&
        moment(`${moment().hour()}:${moment().minute()}`, `H:m`).isSameOrAfter(
          moment("19:00", "H:mm"),
          "minute"
        ))
    );

    console.log("close monthly view modal");
    await (await page.$("#cancel-daily-attendance-entry")).click();

    await browser.close();

    console.log("done!");
  } catch (e) {
    console.log("Somethings went wrong: ", e);
  }
})();
