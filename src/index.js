(async () => {
    const Discord = require('discord.js');
    const config = require(__dirname + '/../config.json');
    const sqlite = require('sqlite');
    const bot = new Discord.Client();
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
        if (oldMember.voiceChannelID === newMember.voiceChannelID) return;

        const channels = await db.all('SELECT voice_id, text_id FROM channels');

        // Dealing with a linked channel
        if (channels.some((v) => v.voice_id == oldMember.voiceChannelID)) {
            const voiceChannel = bot.channels.get(oldMember.voiceChannelID);
            const textChannel = bot.channels.get(channels.find((v) => v.voice_id == oldMember.voiceChannelID).text_id);
            const permissions = textChannel.permissionOverwrites.find((v) => v.id == oldMember.id);

            if (voiceChannel.members.array().length < 1) {
                db.run('UPDATE channels SET set_to_purge = 1 WHERE voice_id = ?', [oldMember.voiceChannelID]);
            }
            
            if (permissions) permissions.delete();
            if (config.emitLog) textChannel.send(`${oldMember} has left the voice channel.`);
        }

        // Dealing with a linked channel
        if (channels.some((v) => v.voice_id == newMember.voiceChannelID)) {
            const textChannel = bot.channels.get(channels.find((v) => v.voice_id == newMember.voiceChannelID).text_id);

            db.run('UPDATE channels SET set_to_purge = 0 WHERE voice_id = ?', [newMember.voiceChannelID]);

            textChannel.overwritePermissions(newMember, { "VIEW_CHANNEL": true });
            if (config.emitLog) textChannel.send(`${newMember} has entered the voice channel.`);
        }
    });

    bot.once('ready', () => {
        setInterval(purgeAll, config.purgeInterval);
    });

    bot.on('ready', () => {
        console.log(`[${[Date.now()]}] Bot connected!`);
    });
        
    bot.login(config.token);
})();
