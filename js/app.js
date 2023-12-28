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
		let render = document.querySelector('.render');
		if (render) render.remove();

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
			let resultsRendered = renderData(Object.values(storedEndpoints), false);
			document.getElementById('resultsContainer').appendChild(resultsRendered);
		});
	});
}

function renderData(data, isTeamView = false, className) {
	// creates a minimal offscreen DOM tree. We use this to prevent multiple reflows <3
	let resultsRendered = document.createDocumentFragment();
	let container = document.createElement('div');

	// Use the provided classname, or 'container' if no classname is provided
	container.className = className || 'render';

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

		// decide which button to add depending on which view we are currently in
		if (isTeamView) {
			// in team view we want to be able to remove the pokemon from the team
			let button = createElement('button', 'remove-btn', '-');
			button.addEventListener('pointerdown', function () {
				let mainTeam = localStorage.getItem('mainTeam') ? JSON.parse(localStorage.getItem('mainTeam')) : [];
				let reserveTeam = localStorage.getItem('reserveTeam') ? JSON.parse(localStorage.getItem('reserveTeam')) : [];

				// if the pokemon is in mainTeam, remove it from mainTeam, else remove it from reserveTeam.
				let mainTeamIndex = mainTeam.findIndex(p => p.name === pokemon.name);
				let reserveTeamIndex = reserveTeam.findIndex(p => p.name === pokemon.name);

				if (mainTeamIndex !== -1) {
					mainTeam.splice(mainTeamIndex, 1);
					console.log(pokemon.name + ' removed from mainTeam');

					// If there are any pokemons in the reserveTeam, move the first one to the mainTeam
					if (reserveTeam.length > 0) {
						// remove first element from reserveTeam and add it to mainTeam
						let movedPokemon = reserveTeam.shift();
						mainTeam.push(movedPokemon);
						console.log('movedPokemon:', movedPokemon);
						localStorage.setItem('reserveTeam', JSON.stringify(reserveTeam));
					}

					localStorage.setItem('mainTeam', JSON.stringify(mainTeam));
				} else if (reserveTeamIndex !== -1) {
					reserveTeam.splice(reserveTeamIndex, 1);
					localStorage.setItem('reserveTeam', JSON.stringify(reserveTeam));
				}

				// remove pokemon so you can't select it again
				card.remove();

				// Clear the content of the team containers
				let mainTeamContainer = document.querySelector('.mainTeam-container');
				let reserveTeamContainer = document.querySelector('.reserveTeam-container');
				mainTeamContainer.innerHTML = '';
				reserveTeamContainer.innerHTML = '';

				// Re-render the view
				let mainTeamRendered = renderData(mainTeam, true, 'mainTeamContainer');
				let reserveTeamRendered = renderData(reserveTeam, true, 'reserveTeamContainer');

				// append the rendered teams to their respective containers
				mainTeamContainer.appendChild(mainTeamRendered);
				reserveTeamContainer.appendChild(reserveTeamRendered);
				manageTeamRender();
			});
			abilitiesContainer.appendChild(button);
		}
		else {
			// but in the search view we want to be able to add the pokemon to the team
			let button = createElement('button', 'add-btn', '+');
			button.addEventListener('pointerdown', function () {
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
			abilitiesContainer.appendChild(button);
		}

		// build element structure
		card.appendChild(cardImage);
		card.appendChild(cardTitle);
		card.appendChild(cardText);
		card.appendChild(abilitiesContainer);
		resultsRendered.appendChild(card);
	});
	container.appendChild(resultsRendered);
	return container;
}

const manageTeamBtn = document.querySelector('.btn-team');
manageTeamBtn.addEventListener('pointerdown', function () {
	const resultsContainer = document.getElementById('resultsContainer');
	if (resultsContainer) {
		resultsContainer.innerHTML = '';
		console.log('trying to clear results');
	}
	manageTeamRender();
});

function manageTeamRender(searchContainer) {

	let teamWarning = document.querySelector('.team-warning');
	if (teamWarning) teamWarning.remove();

	let mainTeam = localStorage.getItem('mainTeam') ? JSON.parse(localStorage.getItem('mainTeam')) : [];
	let reserveTeam = localStorage.getItem('reserveTeam') ? JSON.parse(localStorage.getItem('reserveTeam')) : [];
	console.log('clicked');
	// in case we want to clear the entire search container completely, keeping this for reference
	// let container = document.querySelector('.container');
	// if (container) container.remove();

	let mainTeamContainer = document.querySelector('.mainTeam-container');
	if (!mainTeamContainer) {
		mainTeamContainer = document.createElement('div');
		mainTeamContainer.className = 'mainTeam-container';
		document.body.appendChild(mainTeamContainer);
	} else {
		mainTeamContainer.innerHTML = '';
	}

	let reserveTeamContainer = document.querySelector('.reserveTeam-container');
	if (!reserveTeamContainer) {
		reserveTeamContainer = document.createElement('div');
		reserveTeamContainer.className = 'reserveTeam-container';
		document.body.appendChild(reserveTeamContainer);
	} else {
		reserveTeamContainer.innerHTML = '';
	}

	let mainTeamRendered = renderData(mainTeam, true, 'mainTeam-container');
	let mainTeamTitle = createElement('h2', '', 'Main Team:');
	mainTeamTitle.style.gridColumn = "1 / -1";
	mainTeamTitle.style.textAlign = "center";
	mainTeamRendered.prepend(mainTeamTitle);
	mainTeamContainer.appendChild(mainTeamRendered);

	let reserveTeamRendered = renderData(reserveTeam, true, 'reserveTeam-container');
	let reserveTeamTitle = createElement('h2', 'team-title', 'Reserve Team:');
	reserveTeamTitle.style.gridColumn = "1 / -1";
	reserveTeamTitle.style.textAlign = "center";
	reserveTeamRendered.prepend(reserveTeamTitle);
	reserveTeamContainer.appendChild(reserveTeamRendered);

	let resultsContainer = document.getElementById('resultsContainer');
	if (resultsContainer && mainTeam.length < 3) {
		resultsContainer.prepend(createElement('label', 'team-warning', 'You need at least 3 pokemon in your team!'));
	}
	if (!resultsContainer && mainTeam.length < 3) {
		let teamWarning = createElement('label', 'team-warning', 'You need at least 3 pokemon in your team!');
		teamWarning.style.gridColumn = "1 / -1";
		teamWarning.style.textAlign = "center";
		let header = document.querySelector('header');
		// if header exists, insert the warning after the header element
		if (header) header.insertAdjacentElement('afterend', teamWarning);
	}

	if (mainTeam.length === 0) {
		mainTeamContainer.remove();
		reserveTeamContainer.remove();
	}

}
