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
		option.addEventListener('click', function () {
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

let filteredResults;
searchPokemons(searchInput);

let storedEndpoints = JSON.parse(localStorage.getItem('storedEndpoints')) || {};


// TODO: Figure out a better way to not overload the API but also not potentially max out local storage?

function searchPokemons(searchInput) {
	document.getElementById('search').addEventListener('submit', function (event) {
		event.preventDefault();
		let searchResults = JSON.parse(localStorage.getItem('pokemons'));
		let filteredResults = searchResults.results.filter(pokemon => pokemon.name.includes(searchInput.value));
		let endpoints = filteredResults.map(pokemon => `https://pokeapi.co/api/v2/pokemon/${pokemon.name}/`);

		let teamContainer = document.querySelector('.team-container');
		// If the team container is visible, hide it
		if (teamContainer && teamContainer.innerHTML !== '') {
			teamContainer.innerHTML = '';
		}
		// waits for all the promises to resolve
		Promise.all(endpoints.map(endpoint => {
			if (!storedEndpoints[endpoint]) {
				return fetch(endpoint)
					.then(response => response.json())
					.then(data => {
						storedEndpoints[endpoint] = data;
					})
					.catch(error => console.error('Error:', error));
			}
		})).then(() => {
			// and then we can use it
			localStorage.setItem('storedEndpoints', JSON.stringify(storedEndpoints));
		});
	});
}

const team = {};
getTeam().then(team => {
	console.log('team gathered. Team consist of:', team);
});

const manageTeamBtn = document.querySelector('.btn-team');
manageTeamBtn.addEventListener('pointerdown', function () {
	let teamContainer = renderTeam(team);
	document.body.appendChild(teamContainer);
});

function renderTeam(team) {
	const teamContainer = document.createElement('div');
	teamContainer.classList.add('team-container');

	const teamHeader = document.createElement('h2');
	teamHeader.textContent = 'Current team:';

	const pokemonCard = document.createElement('div');
	pokemonCard.classList.add('pokemon-card');

	// get the pokemons stored in team.json
	for (let pokemon in team) {
		let pokemonInfo = document.createElement('p');
		pokemonInfo.textContent = `${pokemon}: ${JSON.stringify(team[pokemon])}`;
		pokemonCard.appendChild(pokemonInfo);
	}

	teamContainer.appendChild(teamHeader);
	teamContainer.appendChild(pokemonCard);

	// note, this return a DOM element, so needs to be called like so:
	// let element = renderTeam(team)();

	return teamContainer;
}

