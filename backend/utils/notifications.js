export const sendPushNotification = async (tokens, title, body, data = {}) => {
    if (!tokens || tokens.length === 0) return;

    const validTokens = tokens.filter(t => t && t.startsWith('ExponentPushToken'));
    if (validTokens.length === 0) return;

    const messages = validTokens.map(token => ({
        to: token,
        sound: 'default',
        title,
        body,
        data,
    }));

    try {
        await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify(messages),
        });
    } catch (err) {
        console.error('Push notification error:', err);
    }
};
