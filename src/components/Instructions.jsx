const STEPS = [
  ["🎡", "Spin the wheel", "Tap the SPIN button and watch it go."],
  ["🎯", "Land on a topic", "Password, Irish Trivia, Soc. Eng., AI or Malware."],
  ["⏱️", "Answer one question", "You have 20 seconds — pick your answer."],
  ["🎁", "Win a prize", "Get it right to win. Hit ⭐ JACKPOT for a mystery prize!"],
  ["🤝", "Claim it at the booth", "Show your result screen to the CHS team."],
];

export default function Instructions({ name, onStart }) {
  return (
    <>
      <div className="m-head">
        <span className="m-emoji">👋</span>
        <h2 id="howto-title">Welcome, {name.split(" ")[0]}!</h2>
        <p>Here’s how it works</p>
      </div>
      <ol className="steps">
        {STEPS.map(([icon, title, text]) => (
          <li key={title}>
            <span className="n">{icon}</span>
            <div><b>{title}</b><span>{text}</span></div>
          </li>
        ))}
      </ol>
      <div className="rules-note">
        <span>⚠️</span>
        <span><b>You get one spin only.</b> Each email and each device can play once — so make it count!</span>
      </div>
      <button className="btn" onClick={onStart}>Got it — let’s spin!</button>
    </>
  );
}
