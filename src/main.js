import App from './App.svelte';
import gameConfig from './game-config.json';
import { mount } from 'svelte';

const app = mount(App, {
  target: document.getElementById('app'),
  props: {
    gameConfig: gameConfig
  }
});

export default app;