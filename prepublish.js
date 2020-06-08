const fs = require('fs');

const destination = './dist/package.json';
const source = './package.json';
fs.copyFile(source, destination, (err) => {
  if (err) throw err;
  console.log(`${source} copied to ${destination}`);
});