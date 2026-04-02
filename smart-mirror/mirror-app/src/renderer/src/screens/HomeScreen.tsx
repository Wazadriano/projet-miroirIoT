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
      <div style={{ marginTop: '3vh', textAlign: 'center', zIndex: 1 }}>
        <h1 className="title-xl" style={{ letterSpacing: '0.5vw' }}>K BEAUTY</h1>
        <p className="title-sm" style={{ letterSpacing: '1vw', marginTop: '0.5vh', opacity: 0.8 }}>COSMETICS</p>
        <p style={{ fontSize: 'var(--fs-sm)', marginTop: '0.3vh', opacity: 0.6 }}>&#54868;&#51109;&#54408;</p>
      </div>

      {/* Product carousel */}
      <div style={{
        display: 'flex',
        gap: '2.5vw',
        justifyContent: 'center',
        alignItems: 'stretch',
        marginTop: '3vh',
        padding: '0 2.5vw',
        zIndex: 1,
        flex: 1,
        maxHeight: '45vh'
      }}>
        {PRODUCTS.map((product, i) => (
          <div key={i} className="glass-card" style={{
            flex: 1,
            maxWidth: '30vw',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '2.5vw',
            opacity: 0.59,
            borderRadius: '2.5vw',
            boxShadow: 'inset 0px 0px 12.5vw 0px var(--color-shadow-gold)'
          }}>
            <img
              src={product.image}
              alt=""
              style={{ height: '20vh', objectFit: 'contain', marginBottom: '1.5vh' }}
            />
            <p className="detail" style={{ flex: 1 }}>{product.text}</p>
          </div>
        ))}
      </div>

      {/* Carousel dots */}
      <div className="carousel-dots" style={{ marginTop: '2vh', zIndex: 1 }}>
        <div className="dot active" />
        <div className="dot" />
        <div className="dot" />
      </div>

      {/* CTA */}
      <button
        className="glass-btn"
        onClick={() => setScreen('accueil')}
        style={{ width: '47.5vw', marginTop: '3vh', zIndex: 1 }}
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
