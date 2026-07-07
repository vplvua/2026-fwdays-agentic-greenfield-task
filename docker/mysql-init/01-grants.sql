-- Local dev only: Prisma Migrate needs rights to create its temporary
-- shadow database (https://pris.ly/d/migrate-shadow). Production (Railway)
-- never runs `migrate dev`, only `migrate deploy` — no shadow DB there.
GRANT ALL PRIVILEGES ON *.* TO 'servicedesk'@'%';
FLUSH PRIVILEGES;
