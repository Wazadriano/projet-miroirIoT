import { useSessionStore } from '../stores/session.store'
import productSkin1004 from '../assets/product-skin1004-3885bd.png'
import productCosrx from '../assets/product-cosrx-254d84.png'
import productNumbuzin from '../assets/product-numbuzin-1928cd.png'

const PRODUCTS = [
  {
    image: productSkin1004,
    text: 'Le SKIN1004 Centella Light Cleansing Oil Nettoie, demaquille et apaise la peau en douceur.'
  },
  {
    image: productCosrx,
    text: 'Le COSRX Good Morning Low pH Cleanser Nettoie en douceur, respecte le pH de la peau et preserve son equilibre sans tiraillements.'
  },
  {
    image: productNumbuzin,
    text: 'Le Numbuzin Toner 3 Super Glowing, Essence Hydrate intensement, illumine la peau et ameliore sa texture.'
  }
]

export function HomeScreen(): JSX.Element {
  const { setScreen } = useSessionStore()

  return (
    <div className="screen" style={{ padding: 0, justifyContent: 'flex-start' }}>
      {/* Logo */}
      <div style={{ marginTop: 20, textAlign: 'center', zIndex: 1 }}>
        <h1 className="title-xl" style={{ fontSize: 28, letterSpacing: 2 }}>K BEAUTY</h1>
        <p className="title-sm" style={{ letterSpacing: 4, marginTop: 4, opacity: 0.8 }}>COSMETICS</p>
      </div>

      {/* Product carousel */}
      <div style={{
        display: 'flex',
        gap: 10,
        justifyContent: 'center',
        alignItems: 'stretch',
        marginTop: 40,
        padding: '0 10px',
        zIndex: 1,
        flex: 1,
        maxHeight: 320
      }}>
        {PRODUCTS.map((product, i) => (
          <div key={i} className="glass-card" style={{
            flex: 1,
            maxWidth: 140,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: 10,
            opacity: 0.59,
            borderRadius: 10,
            boxShadow: 'inset 0px 0px 50px 0px var(--color-shadow-gold)'
          }}>
            <img
              src={product.image}
              alt=""
              style={{ height: 120, objectFit: 'contain', marginBottom: 10 }}
            />
            <p className="detail" style={{ flex: 1 }}>{product.text}</p>
          </div>
        ))}
      </div>

      {/* Carousel dots */}
      <div className="carousel-dots" style={{ marginTop: 16, zIndex: 1 }}>
        <div className="dot active" />
        <div className="dot" />
        <div className="dot" />
      </div>

      {/* CTA */}
      <button
        className="glass-btn"
        onClick={() => setScreen('accueil')}
        style={{ width: 190, height: 50, marginTop: 24, zIndex: 1 }}
      >
        COMMENCER
      </button>

      {/* Promo banner */}
      <div className="promo-banner">
        PROMOTION EXCEPTIONNELLE -20%
      </div>
    </div>
  )
}
