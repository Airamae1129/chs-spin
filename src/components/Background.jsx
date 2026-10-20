// Drifting outlined squares echo the CHS logo mark.
export default function Background() {
  return (
    <div className="bg" aria-hidden="true">
      {[1, 2, 3, 4, 5, 6].map((n) => <span key={n} className={`sq s${n}`} />)}
    </div>
  );
}
