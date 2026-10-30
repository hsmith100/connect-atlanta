import SEO from '../../components/shared/SEO'
import Header from '../../components/layout/Header'
import Footer from '../../components/layout/Footer'
import ShopPage from '../../components/store/ShopPage'

export default function Shop() {
  return (
    <>
      <SEO
        title="Shop | Beats on the Block"
        description="Shop official Beats on the Block merch and download full-resolution event photos, produced by Connect Atlanta."
        canonicalUrl="https://beatsontheblockfest.com/shop"
      />
      <Header />
      <main className="pt-28 md:pt-[3.5rem]">
        <ShopPage />
      </main>
      <Footer />
    </>
  )
}
