import { Link } from 'react-router-dom'

const BrandIcon = () => (
  <svg 
    width="24" 
    height="24" 
    viewBox="0 0 32 32" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className="brand-icon-svg"
  >
    {/* Cocktail glass outline */}
    <path 
      d="M22.9996 7H12.9996H7.00061L11.2406 11.24L18.0006 18L28.9996 7H22.9996Z" 
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    
    {/* Glass bowl */}
    <path 
      d="M13 7H7L11.24 11.24C10.16 12.33 8.66 13 7 13C3.69 13 1 10.31 1 7C1 3.69 3.69 1 7 1C10.31 1 13 3.69 13 7Z" 
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    
    {/* Glass stem and base */}
    <path 
      d="M11 30.9998H25M18 30.9998V17.9998L29 6.99981H7.00002L16 15.9998" 
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    
    {/* Decorative olive/cherry on rim */}
    <path 
      d="M12.2051 4.01351C11.1701 2.21251 9.22612 0.999512 7.00012 0.999512C3.68612 0.999512 1.00012 3.68651 1.00012 6.99951C1.00012 10.3135 3.68612 12.9995 7.00012 12.9995C8.65612 12.9995 10.1561 12.3275 11.2421 11.2425M29 0.999812L23 6.99981" 
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <div className="brand-line">
            <span className="brand-icon"><BrandIcon /></span>
            <span className="brand-name">Pub Söcial</span>
          </div>
          <p className="brand-blurb">Making bars more fun, one quip at a time.</p>
        </div>

        <nav className="footer-col">
          <h4>Product</h4>
          <ul>
            <li><Link to="/venues">For Venues</Link></li>
            <li><Link to="/#features">Features</Link></li>
            <li><Link to="/#pricing">Pricing</Link></li>
            <li><Link to="/#how">How It Works</Link></li>
          </ul>
        </nav>

        <nav className="footer-col">
          <h4>Company</h4>
          <ul>
            <li><Link to="/about">About</Link></li>
            <li><Link to="/contact">Contact</Link></li>
          </ul>
        </nav>

        <nav className="footer-col">
          <h4>Legal</h4>
          <ul>
            <li><Link to="/privacy">Privacy</Link></li>
            <li><Link to="/terms">Terms</Link></li>
          </ul>
        </nav>
      </div>

      <div className="footer-bottom">
        <div className="container copy">© 2025 Pub Söcial. All rights reserved.</div>
      </div>
    </footer>
  )
}
