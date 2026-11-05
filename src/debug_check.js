const fs = require('fs');
const content = fs.readFileSync('./src/app/api/users/route.ts', 'utf8');
const lines = content.split('\n');
console.log('Lines 135-143:');
for (let i = 134; i < 143; i++) {
  console.log(`${i+1}: ${JSON.stringify(lines[i])}`);
}
