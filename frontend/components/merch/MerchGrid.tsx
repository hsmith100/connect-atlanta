import Image from 'next/image'

const MERCH_ITEMS = [
  {
    name: 'BOTB 2026 Colorblast Tee',
    price: '$35.00',
    image: '/images/merch/Gray-Shirt.jpeg',
    url: 'https://www.bonfire.com/botb-2026-colorblast-tee/',
  },
  {
    name: 'BOTB 2026 Green Tee',
    price: '$35.00',
    image: '/images/merch/Blue-Green-Shirt.jpeg',
    url: 'https://www.bonfire.com/botb-2026-green-tee/',
  },
]

export default function MerchGrid() {
  return (
    <div>
      <div className="flex flex-wrap justify-center gap-8 max-w-6xl mx-auto mb-12">
        {MERCH_ITEMS.map((item) => (
          <a
            key={item.name}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full sm:w-96 bg-brand-bg-cream border-2 border-brand-primary/20 rounded-2xl overflow-hidden shadow-md hover:border-brand-primary hover:shadow-xl transition-all group cursor-pointer"
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

      <div className="text-center max-w-3xl mx-auto py-8">
        <h2 className="font-title text-3xl md:text-5xl font-black mb-4 text-brand-header uppercase">
          Get Your Merch
        </h2>
        <p className="text-xl text-brand-header/80 mb-6">
          All merchandise is available for purchase at our events and online. Follow us on social media for announcements about upcoming festivals and merch drops!
        </p>
        <a
          href="https://www.bonfire.com/store/beats-on-the-block/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-brand-primary text-white font-bold py-3 px-8 rounded-full hover:opacity-90 transition-opacity text-lg"
        >
          Shop All on Bonfire
        </a>
      </div>
    </div>
  )
}
