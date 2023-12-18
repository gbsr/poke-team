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

			let resultsRendered = renderData(Object.values(storedEndpoints), cardContainer, traversalContainer);
			document.body.appendChild(resultsRendered);
		});
	});
}

const team = {};
getTeam().then(team => {
	console.log('team gathered. Team consist of:', team);
});

const manageTeamBtn = document.querySelector('.btn-team');
manageTeamBtn.addEventListener('pointerdown', function () {
	let teamContainer = renderData(team, 'Current Team');
	document.body.appendChild(teamContainer);
});


// create static elements for the card container
const { cardContainer, traversalContainer } = buildTraversalForCardResults();

function buildTraversalForCardResults() {

	// container for the cards
	const cardContainer = document.createElement('div');
	cardContainer.classList.add('data-cardContainer');

	// buttons
	const prevButton = document.createElement('button');
	const traversalContainer = document.createElement('div');
	traversalContainer.classList.add('traversal-container');
	prevButton.classList.add('prev-button'); // Add a class for selector
	prevButton.textContent = '<';
	prevButton.addEventListener('pointerdown', function () {
		switchCard(cardContainer, -1);
	});

	const nextButton = document.createElement('button');
	nextButton.classList.add('next-button'); // Add a class for selector
	nextButton.textContent = '>';
	nextButton.addEventListener('pointerdown', function () {
		switchCard(cardContainer, 1);
	});

	// Append static elements to the container
	traversalContainer.appendChild(prevButton);
	traversalContainer.appendChild(nextButton);

	return { cardContainer, traversalContainer };
}

function renderData(data, cardContainer, traversalContainer) {

	// clear before running
	cardContainer.innerHTML = '';

	// create the cards for each data item
	data.forEach((item, index) => {
		const card = document.createElement('div');
		card.classList.add('data-card');

		// hide all cards but first
		if (index !== 0) {
			card.style.display = 'none';
		}
		cardContainer.appendChild(card);

		let pokemonName = document.createElement('h3');
		pokemonName.textContent = item.name;
		card.appendChild(pokemonName);

		item.abilities.forEach(ability => {
			if (ability && ability.ability) {
				let abilityInfo = document.createElement('p');
				abilityInfo.textContent = ability.ability.name;
				card.appendChild(abilityInfo);
			}
		});
	});
	cardContainer.appendChild(traversalContainer);
	return cardContainer;
}

function switchCard(cardContainer, direction) {
	const cards = Array.from(cardContainer.querySelectorAll('.data-card'));
	const currentCardIndex = cards.findIndex(card => card.style.display !== 'none');
	let nextCardIndex = currentCardIndex + direction;

	let filteredEndpoints = Object.values(storedEndpoints).filter(pokemon => pokemon.name.includes(searchInput.value));

	if (nextCardIndex < 0) {
		nextCardIndex = filteredEndpoints.length - 1; // Wrap around to the last card
	} else if (nextCardIndex >= filteredEndpoints.length) {
		nextCardIndex = 0; // Wrap around to the first card
	}

	cards[currentCardIndex].style.display = 'none';
	cards[nextCardIndex].style.display = 'block';
	console.log('siwtching cards.');
}

