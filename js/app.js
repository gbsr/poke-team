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
// const searchButton = document.querySelector('.submit');

searchPokemons(searchInput);

let storedEndpoints = JSON.parse(localStorage.getItem('storedEndpoints')) || {};


// TODO: Limit search to minimum of 3 characters

function searchPokemons(searchInput) {
	document.getElementById('searchForm').addEventListener('submit', function (event) {
		event.preventDefault();
		let searchResults = JSON.parse(localStorage.getItem('pokemons'));
		let filteredResults = searchResults.results.filter(pokemon => pokemon.name.includes(searchInput.value.toLowerCase()));
		let endpoints = filteredResults.map(pokemon => `https://pokeapi.co/api/v2/pokemon/${pokemon.name}/`);

		// whenever we hit submit we check if team-warning exists and remove it
		document.querySelector('.team-warning') && document.querySelector('.team-warning').remove();
		// and here we do the same for the teamcontainer also, since we want to switch between views
		document.querySelector('.team-container') && document.querySelector('.team-container').remove();

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
			document.getElementById('resultsContainer').appendChild(resultsRendered);
		});
	});
}

function renderData(data) {
	// creates a minimal offscreen DOM tree. We use this to prevent multiple reflows <3
	let resultsRendered = document.createDocumentFragment();
	let teamContainer = createElement('div', 'team-container', '');

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
	teamContainer.appendChild(resultsRendered);
	return teamContainer;
}

const manageTeamBtn = document.querySelector('.btn-team');
manageTeamBtn.addEventListener('pointerdown', function () {
	manageTeamRender();
});

function manageTeamRender() {
	let mainTeam = localStorage.getItem('mainTeam') ? JSON.parse(localStorage.getItem('mainTeam')) : [];
	let reserveTeam = localStorage.getItem('reserveTeam') ? JSON.parse(localStorage.getItem('reserveTeam')) : [];

	let mainTeamRendered = renderData(mainTeam);
	let mainTeamTitle = createElement('h2', '', 'Main Team:');
	// because of how convoluted the css is, we need to set the grid-column manually
	// TODO: clean up CSS because damn haha!
	mainTeamTitle.style.gridColumn = "1 / -1";
	mainTeamTitle.style.textAlign = "center";

	mainTeamRendered.prepend(mainTeamTitle);



	let reserveTeamRendered = renderData(reserveTeam);
	let reserveTeamTitle = createElement('h2', 'team-title', 'Reserve Team:');
	// same here then
	reserveTeamTitle.style.gridColumn = "1 / -1";
	reserveTeamTitle.style.textAlign = "center";

	reserveTeamRendered.prepend(reserveTeamTitle); // Append the title to reserveTeamRendered before it's added to the DOM

	// remove the team container if it exists already
	if (document.querySelector('.team-container')) document.querySelector('.team-container').remove();
	document.getElementById('resultsContainer').appendChild(mainTeamRendered);
	document.getElementById('resultsContainer').appendChild(reserveTeamRendered);

	if (mainTeam.length < 3) {
		document.getElementById('resultsContainer').prepend(createElement('label', 'team-warning', 'You need at least 3 pokemon in your team!'));
	}
}
