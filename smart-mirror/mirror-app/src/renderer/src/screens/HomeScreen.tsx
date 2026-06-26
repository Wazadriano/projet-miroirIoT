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
    <div className="screen" style={{ padding: '6vh 0 0', justifyContent: 'flex-start', gap: '3vh' }}>
      {/* Logo */}
      <div style={{ textAlign: 'center', zIndex: 1 }}>
        <p className="detail" style={{ letterSpacing: '0.5em', textTransform: 'uppercase', color: 'var(--color-accent)', opacity: 0.85, marginBottom: '0.6vh' }}>
          Bubble Hair Spa
        </p>
        <h1 className="title-xl" style={{ letterSpacing: '0.3vw' }}>K BEAUTY</h1>
        <p className="title-sm" style={{ letterSpacing: '0.8vw', marginTop: '0.4vh', opacity: 0.8 }}>COSMETICS</p>
      </div>

      {/* Product carousel : colonne de contenu centree, cartes a echelle miroir */}
      <div className="content" style={{
        flexDirection: 'row',
        gap: '2vw',
        justifyContent: 'center',
        alignItems: 'stretch',
        marginInline: 'auto',
        maxWidth: '820px',
        zIndex: 1
      }}>
        {PRODUCTS.map((product, i) => (
          <div key={i} className="glass-card" style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1.2vh',
            padding: '1.8vw',
            opacity: 0.62,
            borderRadius: 'var(--radius)',
            boxShadow: 'inset 0px 0px 5vw 0px var(--color-shadow-gold)'
          }}>
            <img
              src={product.image}
              alt=""
              style={{ height: '15vh', objectFit: 'contain' }}
            />
            <p className="detail" style={{ flex: 1, lineHeight: 1.4 }}>{product.text}</p>
          </div>
        ))}
      </div>

      {/* Carousel dots */}
      <div className="carousel-dots" style={{ zIndex: 1 }}>
        <div className="dot active" />
        <div className="dot" />
        <div className="dot" />
      </div>

      {/* CTA */}
      <button
        className="glass-btn"
        onClick={() => setScreen('accueil')}
        style={{ width: '100%', maxWidth: '420px', marginInline: 'auto', zIndex: 1 }}
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
