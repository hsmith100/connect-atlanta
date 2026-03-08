import Image from 'next/image'

const MERCH_ITEMS = [
  {
    name: 'Beats on the Beltline 2025 White Tee',
    price: '$35.00',
    image: '/images/merch/whitetshirt.jpg',
    url: 'https://connectmerch-shop.fourthwall.com/products/beats-on-the-beltline-2025-white-tee',
  },
  {
    name: 'Beats on the Beltline 2025 Black Retro Tee',
    price: '$35.00',
    image: '/images/merch/retrotee.jpg',
    url: 'https://connectmerch-shop.fourthwall.com/products/beats-on-the-beltline-2025-retro-tee-2',
  },
  {
    name: 'Beats on the Beltline 2025 Disco Tee',
    price: '$35.00',
    image: '/images/merch/discotee.jpg',
    url: 'https://connectmerch-shop.fourthwall.com/products/beats-on-the-beltline-2025-disco-tee-2',
  },
  {
    name: 'Beats on the Beltline Circle Sticker',
    price: '$4.00',
    image: '/images/merch/circle sticker.png',
    url: 'https://connectmerch-shop.fourthwall.com/products/beats-on-the-beltline-circle-sticker',
  },
  {
    name: 'Beats on the Beltline Block Sticker',
    price: '$4.00',
    image: '/images/merch/blocksticker.png',
    url: 'https://connectmerch-shop.fourthwall.com/products/beats-on-the-beltline-block-sticker',
  },
]

export default function MerchGrid() {
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto mb-12">
        {MERCH_ITEMS.map((item) => (
          <a
            key={item.name}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-brand-bg-cream border-2 border-brand-primary/20 rounded-2xl overflow-hidden shadow-md hover:border-brand-primary hover:shadow-xl transition-all group cursor-pointer"
          >
            <div className="relative aspect-square overflow-hidden">
              <Image
                src={item.image}
                alt={item.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="p-6">
              <h3 className="text-lg font-bold text-brand-header mb-3 leading-tight">{item.name}</h3>
              <p className="text-2xl font-bold text-brand-primary">{item.price}</p>
            </div>
          </a>
        ))}
      </div>

      <div className="text-center max-w-3xl mx-auto">
        <div className="bg-brand-bg-cream border-2 border-brand-primary/20 p-8 rounded-2xl shadow-lg">
          <h2 className="font-title text-3xl md:text-5xl font-black mb-4 text-brand-header uppercase">
            Get Your Merch
          </h2>
          <p className="text-xl text-brand-header/80 mb-6">
            All merchandise is available for purchase at our events. Follow us on social media for announcements about upcoming festivals and merch drops!
          </p>
          <p className="text-lg text-brand-header/70">Can't make it to an event? Order online anytime.</p>
        </div>
      </div>
    </div>
  )
}
