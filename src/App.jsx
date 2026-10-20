import Background from "./components/Background.jsx";
import Game from "./components/Game.jsx";
import Admin from "./components/Admin.jsx";
import SoundToggle from "./components/SoundToggle.jsx";

// Old links used "#/admin" — send them to the real /admin page.
if (window.location.hash.startsWith("#/admin")) window.location.replace("/admin");

const isAdmin = /^\/admin\/?$/.test(window.location.pathname);

export default function App() {
  return (
    <>
      <Background />
      {isAdmin ? <Admin /> : (<><SoundToggle /><Game /></>)}
    </>
  );
}
