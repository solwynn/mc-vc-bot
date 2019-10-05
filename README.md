# mc-vc-bot
A Discord bot for the [Microsoft Community](https://discord.gg/microsoft) server that purges text channels after voice channel inactivity.

Requires a SQLite database in (./db/channels.db)
Schema:

```
CREATE TABLE channels (
    voice_id STRING PRIMARY KEY,
    text_id STRING NOT NULL,
    set_to_purge INTEGER NOT NULL
);
```