import { fetchThemes, setTheme, createThemeSelector } from './themes.js';
import { createElement, fetchPokemons, getTeam } from './helpers.js';

// ------------ Theme handling -------------------
// Fetch the themes and set the default theme (pikachu)
fetchThemes().then(async themes => {
	console.log('App started, themes fetched:', themes);
	await setTheme('pikachu', themes);
	const dropdown = createThemeSelector(themes);

	// Add an event listener to each option
	const options = dropdown.querySelectorAll('.dropdown-option');
	options.forEach(option => {
		option.addEventListener('pointerdown', function () {
			setTheme(this.textContent, themes);
		});
	});
}).catch(error => {
	console.error('Error fetching themes:', error);
});

// ----------------- Pokemon handling ------------------- //
// 
fetchPokemons('https://pokeapi.co/api/v2/pokemon?limit=100000').then(() => {
	console.log('Pokemons fetched');

}).catch(error => {
	console.error('Error fetching pokemons', error);
});

const searchInput = document.querySelector('.searchInput');
const searchButton = document.querySelector('.submit');

searchPokemons(searchInput);

let storedEndpoints = JSON.parse(localStorage.getItem('storedEndpoints')) || {};


// TODO: Limit search to minimum of 3 characters

function searchPokemons(searchInput) {
	document.getElementById('searchForm').addEventListener('submit', function (event) {
		event.preventDefault();
		let searchResults = JSON.parse(localStorage.getItem('pokemons'));
		let filteredResults = searchResults.results.filter(pokemon => pokemon.name.includes(searchInput.value.toLowerCase()));
		let endpoints = filteredResults.map(pokemon => `https://pokeapi.co/api/v2/pokemon/${pokemon.name}/`);

		// waits for all the promises to resolve
		Promise.all(endpoints.map(endpoint => {
			if (!storedEndpoints[endpoint]) {
				return fetch(endpoint)
					.then(response => response.json())
					.then(data => {
						// Only store the front_sprite, abilities, and name properties
						storedEndpoints[endpoint] = {
							front_sprite: data.sprites.front_default,
							abilities: data.abilities,
							name: data.name
						};
						localStorage.setItem('storedEndpoints', JSON.stringify(storedEndpoints)); // Save to localStorage
						return storedEndpoints[endpoint];
					})
					.catch(error => {
						console.error('Error:', error);
						return Promise.reject(error); // Return a rejected promise
					});
			} else {
				return Promise.resolve(storedEndpoints[endpoint]); // Return a promise that resolves to storedEndpoints[endpoint]
			}
		})).then((storedEndpoints) => {
			// and then we can use it
			let resultsRendered = renderData(Object.values(storedEndpoints));
			document.body.appendChild(resultsRendered);
		});
	});
}

function renderData(data) {
	let resultsRendered = document.createDocumentFragment();
	data.forEach(pokemon => {
		// create elements
		let card = createElement('div', 'card', '');
		let cardImage = createElement('img', 'pokemon-display', '');
		cardImage.src = pokemon.front_sprite || 'No-Image-Placeholder.png';
		let cardTitle = createElement('h2', 'card-title', pokemon.name);
		let cardText = createElement('p', 'card-text', '');
		let cardAbilities = createElement('ul', 'card-abilities', '');

		cardText.textContent = 'Abilities:';
		pokemon.abilities.forEach(ability => {
			let abilityItem = createElement('li', 'ability-item', ability.ability.name);
			cardAbilities.appendChild(abilityItem);
		});
		// add abilities to their container
		let abilitiesContainer = createElement('div', 'abilities-container', '');
		abilitiesContainer.appendChild(cardAbilities);

		let addToTeamButton = createElement('button', 'add-btn', '+');
		addToTeamButton.addEventListener('pointerdown', function () {
			let mainTeam = localStorage.getItem('mainTeam') ? JSON.parse(localStorage.getItem('mainTeam')) : [];
			let reserveTeam = localStorage.getItem('reserveTeam') ? JSON.parse(localStorage.getItem('reserveTeam')) : [];

			// if mainTeam is less than 3, add to mainTeam, else add to reserveTeam.
			if (mainTeam.length < 3) {
				mainTeam.push(pokemon);
				localStorage.setItem('mainTeam', JSON.stringify(mainTeam));
			} else {
				reserveTeam.push(pokemon);
				localStorage.setItem('reserveTeam', JSON.stringify(reserveTeam));
			}
			card.remove();
		});
		abilitiesContainer.appendChild(addToTeamButton);

		// build element structure
		card.appendChild(cardImage);
		card.appendChild(cardTitle);
		card.appendChild(cardText);
		card.appendChild(abilitiesContainer);
		resultsRendered.appendChild(card);
	});
	return resultsRendered;
}