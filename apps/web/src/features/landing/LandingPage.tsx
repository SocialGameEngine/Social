import { useEffect, useState } from "react";

type Slide = {
  title: string;
  date: string;
  venue: string;
  tag: string;
};

const SLIDES: Slide[] = [
  { title: "Trivia Night", date: "Mar 6 • 8:00pm", venue: "Local Pub", tag: "TRIVIA" },
  { title: "Prompt Battle", date: "Mar 13 • 8:00pm", venue: "Local Pub", tag: "VOTE" },
  { title: "Mini Tournament", date: "Mar 20 • 8:00pm", venue: "Local Pub", tag: "LIVE" },
  { title: "Theme Night", date: "Mar 27 • 8:00pm", venue: "Local Pub", tag: "SPECIAL" },
];

export function LandingPage() {
  const [i, setI] = useState(0);

  useEffect(() => {
    const t = window.setInterval(() => {
      setI((v) => (v + 1) % SLIDES.length);
    }, 3500);
    return () => window.clearInterval(t);
  }, []);

  const slide = SLIDES[i];

  return (
    <main className="lp">
      {/* Styles on same page */}
      <style>{`
        .lp{
          min-height: 100vh;
          background: #080812;
          color: #f2f2ff;
          display: grid;
          gap: 42px;
          padding: 48px 18px 72px;
        }

        .lp-hero{
          text-align: center;
          padding-top: 24px;
        }

        .lp-title{
          margin: 0;
          font-weight: 900;
          letter-spacing: 0.08em;
          font-size: clamp(54px, 8vw, 110px);
          line-height: 0.95;
          text-transform: uppercase;
        }

        .lp-subtitle{
          margin: 14px 0 0;
          font-size: clamp(18px, 2.2vw, 28px);
          opacity: 0.9;
        }

        .lp-carousel{
          width: min(980px, 92vw);
          margin: 0 auto;
          display: grid;
          gap: 14px;
        }

        .lp-carouselHead{
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
        }

        .lp-h2{
          margin: 0;
          font-size: 22px;
          letter-spacing: 0.02em;
        }

        .lp-dots{
          display: flex;
          gap: 8px;
        }

        .lp-dot{
          width: 10px;
          height: 10px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.35);
          background: transparent;
          cursor: pointer;
          padding: 0;
        }
        .lp-dot.is-active{
          background: rgba(255,255,255,0.85);
          border-color: rgba(255,255,255,0.85);
        }

        .lp-posterWrap{
          display: grid;
          grid-template-columns: 44px 1fr 44px;
          align-items: center;
          gap: 14px;
        }

        .lp-arrow{
          height: 44px;
          width: 44px;
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,0.15);
          background: rgba(255,255,255,0.06);
          color: #fff;
          cursor: pointer;
          font-size: 28px;
          line-height: 1;
        }
        .lp-arrow:hover{
          background: rgba(255,255,255,0.10);
        }

        .lp-poster{
          aspect-ratio: 16 / 9;
          border-radius: 22px;
          border: 1px solid rgba(255,255,255,0.14);
          background:
            radial-gradient(circle at 20% 20%, rgba(124,58,237,0.35), transparent 45%),
            radial-gradient(circle at 80% 25%, rgba(59,130,246,0.28), transparent 45%),
            radial-gradient(circle at 55% 80%, rgba(236,72,153,0.22), transparent 50%),
            rgba(255,255,255,0.05);
          padding: 18px;
          display: grid;
          align-content: start;
          gap: 8px;
          overflow: hidden;
          box-shadow: 0 18px 70px rgba(0,0,0,0.45);
        }

        .lp-tag{
          display: inline-flex;
          justify-self: start;
          padding: 6px 10px;
          border-radius: 999px;
          font-size: 12px;
          letter-spacing: 0.08em;
          border: 1px solid rgba(255,255,255,0.18);
          background: rgba(0,0,0,0.18);
        }

        .lp-posterTitle{
          margin-top: 6px;
          font-weight: 900;
          letter-spacing: 0.02em;
          font-size: clamp(26px, 3vw, 42px);
        }

        .lp-posterMeta{
          opacity: 0.9;
          font-size: 14px;
        }

        .lp-posterHint{
          margin-top: auto;
          opacity: 0.55;
          font-size: 12px;
        }

        .lp-about{
          width: min(820px, 92vw);
          margin: 0 auto;
          display: grid;
          gap: 10px;
          text-align: left;
        }

        .lp-body{
          margin: 0;
          font-size: 16px;
          line-height: 1.6;
          opacity: 0.92;
        }

        @media (max-width: 520px){
          .lp-posterWrap{ grid-template-columns: 38px 1fr 38px; }
          .lp-arrow{ width: 38px; height: 38px; border-radius: 12px; }
        }

        /* Accessibility: reduce motion */
        @media (prefers-reduced-motion: reduce){
          .lp *{ scroll-behavior: auto !important; }
        }
      `}</style>

      {/* 1) Big banner */}
      <section className="lp-hero">
        <h1 className="lp-title">PUB SOCIAL</h1>
        <p className="lp-subtitle">Social Games and Trivia</p>
      </section>

      {/* 2) Poster carousel */}
      <section className="lp-carousel">
        <div className="lp-carouselHead">
          <h2 className="lp-h2">Upcoming</h2>
          <div className="lp-dots" aria-label="Carousel navigation">
            {SLIDES.map((_, idx) => (
              <button
                key={idx}
                className={`lp-dot ${idx === i ? "is-active" : ""}`}
                onClick={() => setI(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                type="button"
              />
            ))}
          </div>
        </div>

        <div className="lp-posterWrap" role="region" aria-label="Upcoming events posters">
          <button
            className="lp-arrow"
            onClick={() => setI((v) => (v - 1 + SLIDES.length) % SLIDES.length)}
            aria-label="Previous poster"
            type="button"
          >
            ‹
          </button>

          <div className="lp-poster" aria-label={`${slide.title} poster`}>
            <div className="lp-tag">{slide.tag}</div>
            <div className="lp-posterTitle">{slide.title}</div>
            <div className="lp-posterMeta">{slide.date}</div>
            <div className="lp-posterMeta">{slide.venue}</div>
            <div className="lp-posterHint">Poster placeholder</div>
          </div>

          <button
            className="lp-arrow"
            onClick={() => setI((v) => (v + 1) % SLIDES.length)}
            aria-label="Next poster"
            type="button"
          >
            ›
          </button>
        </div>
      </section>

      {/* 3) What is Pub Social */}
      <section className="lp-about">
        <h2 className="lp-h2">What is Pub Social?</h2>
        <p className="lp-body">
          Pub Social is a UVic-founded social games and trivia project currently in
          development. We’re looking to partner with local pubs to pilot live game
          nights and refine the experience with real crowds.
        </p>
      </section>
    </main>
  );
}
