/**
 * Composable for generating JSON-LD structured data for SEO
 */

export interface LocalBusinessSchema {
    name: string
    description: string
    url: string
    telephone: string
    address: {
        streetAddress: string
        addressLocality: string
        postalCode: string
        addressCountry: string
    }
    geo: {
        latitude: number
        longitude: number
    }
    openingHours?: string[]
    priceRange?: string
    image?: string
    areaServed?: string[]
}

export function useLocalBusinessSchema(options?: Partial<LocalBusinessSchema>) {
    const defaults: LocalBusinessSchema = {
        name: 'Yoga Ravennah',
        description: 'Ongedwongen yogales in Rotterdam Nesselande. Small group lessen met persoonlijke aandacht voor rust, balans en ontspanning.',
        url: 'https://www.ravennah.com',
        telephone: '+31647699709',
        address: {
            streetAddress: 'Emmy van Leersumhof 24a',
            addressLocality: 'Rotterdam',
            postalCode: '3059 LT',
            addressCountry: 'NL'
        },
        geo: {
            latitude: 51.9683092,
            longitude: 4.5884189
        },
        openingHours: ['Su 08:45-09:45'],
        priceRange: '€€',
        image: 'https://www.ravennah.com/ravennah-social.jpg',
        areaServed: [
            'Rotterdam Nesselande',
            'Waddinxveen',
            'Zuidplas',
            'Zevenhuizen',
            'Capelle aan den IJssel'
        ]
    }

    const config = { ...defaults, ...options }

    const schema = {
        '@context': 'https://schema.org',
        '@type': 'YogaStudio',
        '@id': config.url,
        name: config.name,
        description: config.description,
        url: config.url,
        telephone: config.telephone,
        image: config.image,
        priceRange: config.priceRange,
        address: {
            '@type': 'PostalAddress',
            streetAddress: config.address.streetAddress,
            addressLocality: config.address.addressLocality,
            postalCode: config.address.postalCode,
            addressCountry: config.address.addressCountry
        },
        geo: {
            '@type': 'GeoCoordinates',
            latitude: config.geo.latitude,
            longitude: config.geo.longitude
        },
        openingHoursSpecification: config.openingHours?.map(hours => {
            const [day, time] = hours.split(' ')
            const [opens, closes] = time.split('-')
            return {
                '@type': 'OpeningHoursSpecification',
                dayOfWeek: day === 'Su' ? 'Sunday' : day,
                opens,
                closes
            }
        }),
        areaServed: config.areaServed?.map(area => ({
            '@type': 'City',
            name: area
        }))
    }

    useHead({
        script: [
            {
                type: 'application/ld+json',
                innerHTML: JSON.stringify(schema)
            }
        ]
    })

    return schema
}

export function useLocationPageSchema(
    cityName: string,
    pageUrl: string,
    description: string
) {
    // Add the local business schema
    useLocalBusinessSchema()

    // Add breadcrumb schema for location pages
    const breadcrumbSchema = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: 'https://www.ravennah.com'
            },
            {
                '@type': 'ListItem',
                position: 2,
                name: `Yoga ${cityName}`,
                item: pageUrl
            }
        ]
    }

    useHead({
        script: [
            {
                type: 'application/ld+json',
                innerHTML: JSON.stringify(breadcrumbSchema)
            }
        ]
    })
}
