/** @type {import('next').NextConfig} */
const nextConfig = {
    //image optimization settings
    images: {
        domains: ['aovunuylebhrpawmyfup.supabase.co'],
    },


    //Performance otimizations
    experimental: {
        optimizeCss: true, // if you meant CSS optimization
    },

    //Compress respnses
    compress:true,

    //Security headers
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    {
                        key: 'X-Frame-Options',
                        value: 'DENY',
                    },
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff',
                    },
                    {
                        key: 'Referrer-Policy',
                        value: 'origin-when-gross-origin',
                    },

                ]

            }
        ]
        
    }
};


export default nextConfig
