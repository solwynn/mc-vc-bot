(async () => {
    const Discord = require('discord.js');
    const bot = new Discord.Client();
    const config = require(__dirname + '/../config.json');
    const sqlite = require('sqlite');
    const db = await sqlite.open(__dirname + '/../db/channels.db');

    async function purgeAll() {
        const channels = await db.all('SELECT text_id FROM channels WHERE set_to_purge = 1');

        for (const channel of channels) {
            await purge(bot.channels.get(channel.text_id));
        }
    }

    async function purge(channel) {
        while (true) {
            const messages = await channel.fetchMessages({ limit: 100 });
            if (messages.array().length > 0) {
                await channel.bulkDelete(messages);
            } else {
                db.run('UPDATE channels SET set_to_purge = 0 WHERE text_id = ?', [channel.id]);
                break;
            }
        }
    }

    bot.on('voiceStateUpdate', async (oldMember, newMember) => {
        const channels = await db.all('SELECT voice_id, text_id FROM channels');

        // Dealing with a purge channel
        if (channels.some((v) => v.voice_id == oldMember.voiceChannelID)) {
            const channel = bot.channels.get(oldMember.voiceChannelID);
            if (!channel.members.length) {
                db.run('UPDATE channels SET set_to_purge = 1 WHERE voice_id = ?', [oldMember.voiceChannelID]);
            }
        }

        // Dealing with a purge channel
        if (channels.some((v) => v.voice_id == newMember.voiceChannelID)) {
            db.run('UPDATE channels SET set_to_purge = 0 WHERE voice_id = ?', [newMember.voiceChannelID]);
        }

    });

    bot.once('ready', async () => {
        setInterval(purgeAll, 1800000);
    });
        
    bot.login(config.token);
})();
