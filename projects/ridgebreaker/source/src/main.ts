import R from '@dimforge/rapier3d-compat';
import { Game } from './game/Game';
import './style.css';
import '@fontsource/barlow/400.css';
import '@fontsource/barlow/500.css';
import '@fontsource/barlow/600.css';
import '@fontsource/barlow/700.css';
import '@fontsource/barlow-condensed/600.css';
import '@fontsource/barlow-condensed/800.css';
async function boot() {
  await R.init();
  new Game();
}
boot().catch((error) => {
  console.error('Game initialization failed:', error);
  const app = document.getElementById('app')!;
  app.replaceChildren();
  const title = document.createElement('h1');
  title.textContent = 'The expedition could not load.';
  const message = document.createElement('p');
  message.textContent =
    'Check that WebGL is enabled and reload. ' +
    (error instanceof Error ? error.message : String(error));
  const retry = document.createElement('button');
  retry.textContent = 'RETRY';
  retry.onclick = () => location.reload();
  app.append(title, message, retry);
});
