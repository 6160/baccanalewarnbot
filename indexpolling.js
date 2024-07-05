const fs = require('fs');
const TelegramBot = require('node-telegram-bot-api');

// Replace YOUR_BOT_TOKEN_HERE with the token you received from BotFather
const bot = new TelegramBot(token, { polling: true });

const warningsFilePath = 'warnings.json';
const MAX_WARNINGS = 300000000000000000;

// Load warnings from file
let warnings = loadWarnings();

// Function to save warnings to file
function saveWarnings() {
  fs.writeFileSync(warningsFilePath, JSON.stringify(warnings, null, 2));
}

// Function to load warnings from file
function loadWarnings() {
  if (fs.existsSync(warningsFilePath)) {
    const data = fs.readFileSync(warningsFilePath, 'utf8');
    return JSON.parse(data);
  }
  return {};
}


bot.on('polling_error', (error) => {
  // console.log(error)
  console.log("Polling error code: ",error.code);
  console.log("Error Message: ", error.message);
  console.log("Stack trace: ", error.stack);
});


bot.on('message', (message) => {
	console.log('sssss')
	console.log(`AAA: ${JSON.stringify(message)}`)
});

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, 'Hello! I am a warning bot. Use /warn @username <reason> to warn users.');
});

bot.on('message', (msg) => {
console.log('warn')

const chatId = msg.chat.id;
  const text = msg.text;
 console.log('text: ', text)
  if (text && text.startsWith('/warn')) {
    const parts = text.split(' ');
    const command = parts[0];
    const username = parts[1] ? parts[1].replace('@', '') : null;
    const reason = parts.slice(2).join(' ') || 'perché sì';

    if (command.includes('/warn') && username) {
      if (!warnings[chatId]) {
        warnings[chatId] = {};
      }

      if (!warnings[chatId][username]) {
        warnings[chatId][username] = { count: 0, reasons: [] };
      }

      warnings[chatId][username].count += 1;
      warnings[chatId][username].reasons.push(reason);
      const warnCount = warnings[chatId][username].count;

      // Save warnings to file
      saveWarnings();

      bot.sendMessage(chatId, `@${username} has been warned for: "${reason}". Current warnings: ${warnCount}`);
    }
  }
});

bot.onText(/\/leaderboard/, (msg) => {
  const chatId = msg.chat.id;

  if (!warnings[chatId]) {
    bot.sendMessage(chatId, 'No warnings have been issued in this chat.');
    return;
  }

  const sortedWarnings = Object.entries(warnings[chatId]).sort((a, b) => b[1].count - a[1].count);
  let leaderboard = 'Top Warned Users:\n';

  sortedWarnings.forEach(([user, data], index) => {
    leaderboard += `${index + 1}. ${user}: ${data.count} warnings\n`;
  });

  bot.sendMessage(chatId, leaderboard);
});

bot.onText(/\/warnings @(\w+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const warnedUser = match[1];

  if (!warnings[chatId] || !warnings[chatId][warnedUser]) {
    bot.sendMessage(chatId, `@${warnedUser} has no warnings.`);
    return;
  }

  const warnData = warnings[chatId][warnedUser];
  let warnDetails = `@${warnedUser} has ${warnData.count} warnings:\n`;

  warnData.reasons.forEach((reason, index) => {
    warnDetails += `${index + 1}. ${reason}\n`;
  });

  bot.sendMessage(chatId, warnDetails);
});

