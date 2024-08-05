/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    webpack5: true,
    webpack: (config) => {
        config.resolve.fallback = { fs: false };

        return config;
    },
};

module.exports = nextConfig;

module.exports = {
    async rewrites() {
        const asides = ['day', 'three', 'week', 'month', 'year'];
        let types = [];

        asides.map((aside) => {
            const type = {
                source     : `/${aside.toLowerCase()}/:path*`,
                destination: '/'
            };

            types = [...types, type];
        });

        return [
            ...types
        ];
    }
};
