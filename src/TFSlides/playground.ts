import * as fs from "fs";

// fs.mkdirSync('data/test', { recursive: true })


fs.readFile('src/TFSlides/Sampletemplate.html', (err, data) => {
    console.log(data);
 })