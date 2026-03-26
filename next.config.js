/** @type {import('next').NextConfig} */
const nextConfig = {
    typescript: {
        // NOTE: If type errors occur, regenerate types with `npx supabase gen types typescript`
        ignoreBuildErrors: false,
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**.supabase.co',
            },
            {
                protocol: 'https',
                hostname: 'lh3.googleusercontent.com',
            },
            {
                protocol: 'https',
                hostname: 'avatars.githubusercontent.com',
            },
        ],
    },
};

module.exports = nextConfig;

