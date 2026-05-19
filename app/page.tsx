import { GameContainer } from './components/Game';

export default function Home() {
  return (
    <main className="w-screen h-screen overflow-hidden bg-black" aria-label="Kilo Shooter game">
      <GameContainer />
    </main>
  );
}
