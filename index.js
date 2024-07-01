const fs = require('fs');
const TelegramBot = require('node-telegram-bot-api');

// Replace YOUR_BOT_TOKEN_HERE with the token you received from BotFather
const token = '';
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

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, 'Hello! I am a warning bot. Use /warn @username <reason> to warn users.');
});

bot.onText(/\/warn @(\w+)(?: (.+))?/, (msg, match) => {
  console.log('warn received')
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const warnedUser = match[1];
  const reason = match[2] || 'perché sì';

  if (!warnings[chatId]) {
    warnings[chatId] = {};
  }

  if (!warnings[chatId][warnedUser]) {
    warnings[chatId][warnedUser] = { count: 0, reasons: [] };
  }

  warnings[chatId][warnedUser].count += 1;
  warnings[chatId][warnedUser].reasons.push(reason);
  const warnCount = warnings[chatId][warnedUser].count;

  // Save warnings to file
  saveWarnings();

  if (warnCount >= MAX_WARNINGS) {
    bot.sendMessage(chatId, `@${warnedUser} has been muted for reaching ${MAX_WARNINGS} warnings.`);
    bot.restrictChatMember(chatId, userId, {
      permissions: {
        can_send_messages: false,
      },
    });
    warnings[chatId][warnedUser] = { count: 0, reasons: [] }; // Reset warnings after muting

    // Save warnings to file
    saveWarnings();
  } else {
    console.log('sending message to chat:', chatId)
    bot.sendMessage(chatId, `@${warnedUser} has been warned for: "${reason}". Current warnings: ${warnCount}`);
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
