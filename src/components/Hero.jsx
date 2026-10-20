export default function Hero({ compact }) {
  return (
    <header className="hero">
      <img className="logo" src="/chs-logo.webp" alt="CHS logo" />
      <h1 className="title">Spin for a chance to <span className="hl">Win</span></h1>
      {!compact && <p className="subtitle">Land on a topic, answer the question, see how you did.</p>}
    </header>
  );
}
