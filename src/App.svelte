<script>
  import QRCode from 'qrcode';
  import './styles.css';

  let { gameConfig = [] } = $props();

  let selectedCountry = $state('');
  let selectedGame = $state(null);
  let currentScreen = $state('setup'); // setup, game, completed
  let currentGame = $state(null);
  let currentCardIndex = $state(0);
  let shuffledDeck = $state([]);
  let currentQRCode = $state('');

  const HITSTER_HOST = 'https://www.hitstergame.com';

  function getCountryCode(country) {
    const countryCodes = {
      'Canada': 'ca',
      'United States of America': 'us',
      'United Kingdom': 'uk',
      'Germany': 'de',
      'France': 'fr',
      'Spain': 'es',
      'Italy': 'it',
      'Portugal': 'pt',
      'Netherlands': 'nl',
      'Belgium': 'be',
      'Poland': 'pl',
      'Sweden': 'se',
      'Norway': 'no',
      'Denmark': 'dk',
      'Finland': 'fi',
      'Switzerland': 'ch',
      'Austria': 'at',
      'Greece': 'gr',
      'Czechia/Slovakia': 'cz',
      'Romania': 'ro',
      'Hungary': 'hu',
      'Baltics': 'baltic',
      'Croatia': 'hr',
      'Nordics': 'nordic',
      'Australia': 'au',
      'New Zealand': 'nz',
      'Korea': 'kr',
      'Japan': 'jp',
      'Hong Kong': 'hk',
      'Taiwan': 'tw',
      'Israel': 'il',
      'Philipinnes': 'ph',
      'Peru': 'pe',
      'Lebanon': 'lb',
      'Mexico': 'mx',
      'Argentina': 'ar',
      'Chile': 'cl',
      'Brazil': 'br',
      'Iceland': 'is',
      'Global': 'global'
    };

    return countryCodes[country] || country.toLowerCase().substring(0, 2);
  }

  function getCountries() {
    const countries = [...new Set(gameConfig.map(game => game.country))].sort();
    console.log('Available countries:', countries);
    return countries;
  }

  function getCountryGames() {
    if (!selectedCountry) return [];
    return gameConfig.filter(game => game.country === selectedCountry);
  }

  function getGameDisplayName(game) {
    return game.gameName || game.sku;
  }

  function getCurrentGameDisplayName() {
    if (!currentGame) return '';
    return currentGame.gameName || currentGame.sku;
  }

  function getCurrentCardNumber() {
    if (!shuffledDeck || shuffledDeck.length === 0) return 0;
    return shuffledDeck[currentCardIndex];
  }

  function createShuffledDeck() {
    const cards = Array.from({ length: currentGame.cards }, (_, i) => i + 1);
    shuffledDeck = shuffle(cards);
  }

  function shuffle(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  async function generateQRCode(url) {
    try {
      return await QRCode.toDataURL(url, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
    } catch (error) {
      console.error('Error generating QR code:', error);
      return '';
    }
  }

  async function startGame() {
    if (!selectedGameObj) return;

    console.log('Starting game with:', selectedGameObj);

    currentGame = {
      country: selectedGameObj.country,
      countryCode: getCountryCode(selectedGameObj.country),
      sku: selectedGameObj.sku,
      gameName: selectedGameObj.gameName,
      cards: selectedGameObj.cards
    };

    createShuffledDeck();
    currentCardIndex = 0;
    currentScreen = 'game';
    await showCurrentCard();
  }

  async function showCurrentCard() {
    const currentCardNumber = shuffledDeck[currentCardIndex];
    const formattedCardNumber = currentCardNumber.toString().padStart(5, '0');
    const qrUrl = `${HITSTER_HOST}/${currentGame.countryCode}/${currentGame.sku}/${formattedCardNumber}`;

    currentQRCode = await generateQRCode(qrUrl);
  }

  async function showNextCard() {
    currentCardIndex++;
    if (currentCardIndex >= shuffledDeck.length) {
      currentScreen = 'completed';
    } else {
      await showCurrentCard();
      // Auto-advance after 2 seconds if this is the last card
      if (currentCardIndex >= shuffledDeck.length - 1) {
        setTimeout(() => {
          currentScreen = 'completed';
        }, 2000);
      }
    }
  }

  function playAgain() {
    createShuffledDeck();
    currentCardIndex = 0;
    currentScreen = 'game';
    showCurrentCard();
  }

  function backToSetup() {
    currentScreen = 'setup';
    selectedCountry = '';
    selectedGame = null;
    currentGame = null;
    shuffledDeck = [];
    currentCardIndex = 0;
    currentQRCode = '';
  }

  let canStartGame = $derived(selectedCountry && selectedGame !== null && selectedGame !== '');
  let selectedGameObj = $derived(selectedGame !== null && selectedGame !== '' ? getCountryGames()[selectedGame] : null);
  let isLastCard = $derived(currentCardIndex >= shuffledDeck.length - 1);
  let availableCountries = $derived(getCountries());
  let availableGames = $derived(getCountryGames());
</script>

<div id="app">
  {#if currentScreen === 'setup'}
    <div class="screen active">
      <div class="container">
        <h1>Hitster Companion</h1>
        <p>Select your country and game to start playing</p>

        <div class="form-group">
          <label for="country-select">Country:</label>
          <select bind:value={selectedCountry}>
            <option value="">Select a country...</option>
            {#each availableCountries as country}
              <option value={country}>{country}</option>
            {/each}
          </select>
        </div>

        <div class="form-group">
          <label for="game-select">Game:</label>
          <select bind:value={selectedGame} disabled={!selectedCountry}>
            <option value="">Select a game...</option>
            {#each availableGames as game, index}
              <option value={index}>{getGameDisplayName(game)} ({game.cards} cards)</option>
            {/each}
          </select>
        </div>

        <button class="primary-button" onclick={startGame} disabled={!canStartGame}>Start Playing</button>

        <div class="disclaimer">
          <p><strong>Important:</strong> This app is intended for legitimate owners of Hitster games only. Perfect for situations like traveling with your game, when cards have been lost or damaged, or as a convenient backup during game night. You may only use the game versions that you have purchased and own. This companion app is not affiliated with, endorsed by, or associated with the Hitster brand or its official manufacturers in any way.</p>
        </div>
      </div>
    </div>
  {:else if currentScreen === 'game'}
    <div class="screen active">
      <div class="container">
        <div class="game-header">
          <h2>{currentGame.country} ({getCurrentGameDisplayName()})</h2>
          <p>Card {getCurrentCardNumber()} ({currentCardIndex + 1}/{currentGame.cards})</p>
        </div>

        <div class="qr-container">
          <div id="qr-code">
            {#if currentQRCode}
              <img src={currentQRCode} alt="QR Code" />
            {:else}
              <p>Generating QR code...</p>
            {/if}
          </div>
        </div>

        <div class="controls">
          {#if !isLastCard}
            <button class="primary-button" onclick={showNextCard}>Next Card</button>
          {/if}
          <button class="secondary-button" onclick={backToSetup}>Back to Setup</button>
        </div>
      </div>
    </div>
  {:else if currentScreen === 'completed'}
    <div class="screen active">
      <div class="container">
        <h1>Game Complete!</h1>
        <p>You've gone through all the cards for {currentGame.country} ({getCurrentGameDisplayName()}).</p>
        <button class="primary-button" onclick={playAgain}>Play Again</button>
        <button class="secondary-button" onclick={backToSetup}>New Game</button>
      </div>
    </div>
  {/if}
</div>