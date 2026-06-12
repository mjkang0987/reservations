import 'dotenv/config';
import {defineConfig} from 'prisma/config';

export default defineConfig({
    schema: '../server/prisma/schema.prisma',
    migrations: {
        path: '../server/prisma/migrations',
        seed: 'node ../server/prisma/seed.mjs',
    },
    datasource: {
        url: process.env.DATABASE_URL!,
    },
});
