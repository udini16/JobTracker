const token = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;

async function sendNotification(message) {
  if (!token || !chatId) {
    console.log('Telegram bot not configured. Message:', message);
    return;
  }
  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message
      })
    });
    const data = await response.json();
    if (!data.ok) {
        console.error('Telegram API error:', data);
    }
  } catch (error) {
    console.error('Failed to send Telegram notification:', error);
  }
}

module.exports = { sendNotification };
