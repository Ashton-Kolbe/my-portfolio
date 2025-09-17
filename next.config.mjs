/** @type {import('next').NextConfig} */
const nextConfig = {
    //image optimization settings
    images:{
        remotePatterns:[
            {
            protocol:'https',
            hostname:'images.unsplash.com',
            port:'',
            pathname:'/storage/v1/object/public/**'
            },
            {
                protocol:'https',
                hostname:'images.unsplash.com'
            }, 
        ],
        formats:['image/webp', 'image/avif'],
    },

    //Performance otimizations
    experimental:{
        optimieXss:true,
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


module.exports = nextConfig
