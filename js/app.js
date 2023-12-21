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
						storedEndpoints[endpoint] = data;
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
			let resultsRendered = renderData(Object.values(storedEndpoints), cardContainer);
			document.body.appendChild(resultsRendered);
		});
	});
}

const team = {};
getTeam().then(team => {
	console.log('team gathered. Team consist of:', team);
});

// make the team list and the reserve list to pass to renderData for rendering the entire team
function makeTeamLists(team) {
	// If team is not an object, handle it appropriately
	if (typeof team !== 'object' || team === null) {
		console.log('Team is not an object');
		return { mainTeamMembers: {}, reserves: {} };
	}

	// Create mainTeamMembers and reserves objects
	const mainTeamMembers = {};
	const reserves = {};

	// Add the first 3 members to mainTeamMembers and the rest to reserves
	Object.entries(team).forEach(([key, value], index) => {
		if (index < 3) {
			mainTeamMembers[key] = value;
		} else {
			reserves[key] = value;
		}
	});

	console.log('mainTeamMembers:', mainTeamMembers);
	console.log('reserves:', reserves);

	return { mainTeamMembers, reserves };
}

const manageTeamBtn = document.querySelector('.btn-team');
manageTeamBtn.addEventListener('pointerdown', function () {
	createTeamView();

});


// create static elements for the card container
const { cardContainer } = buildCardContainer();

function createTeamView() {
	const team = JSON.parse(localStorage.getItem('team'));
	const { mainTeamMembers, reserves } = makeTeamLists(team);

	const dataCardContainer = document.querySelector('.data-cardContainer');
	const themeContainer = document.querySelector('.theme.container');

	// first we clear the board
	if (dataCardContainer) {
		dataCardContainer.remove();
	}

	if (themeContainer) {
		themeContainer.classList.add('.-container-hidden');
	}

	// then we construct the team view
	// first the container, if it doesn't exist
	let teamContainer = document.querySelector('.team-container');
	if (!teamContainer) {
		teamContainer = document.createElement('div');
		teamContainer.classList.add('team-container');
		document.body.appendChild(teamContainer);

		const closeTeamBtn = document.createElement('button');
		closeTeamBtn.classList.add('close-btn');
		closeTeamBtn.textContent = 'X';
		teamContainer.appendChild(closeTeamBtn);

		const mainTeamMembersHeader = document.createElement('h3');
		mainTeamMembersHeader.textContent = 'Main Team Members';
		teamContainer.appendChild(mainTeamMembersHeader);
	}

	// Create separate containers for the main team members and reserves
	const mainTeamMembersContainer = document.createElement('div');
	mainTeamMembersContainer.classList.add('main-team-members-container');
	teamContainer.appendChild(mainTeamMembersContainer);


	const reserveseHaader = document.createElement('h3');
	reserveseHaader.textContent = 'Reserve Team Members';
	teamContainer.appendChild(reserveseHaader);
	const reservesContainer = document.createElement('div');
	reservesContainer.classList.add('reserves-container');
	teamContainer.appendChild(reservesContainer);

	if (!team || Object.keys(team).length === 0) {
		const textContent = document.createElement('p');
		textContent.textContent = 'You have no pokemons in your team.';
		teamContainer.appendChild(textContent);
	} else {
		// Pass the containers to renderData
		renderData(mainTeamMembers, mainTeamMembersContainer);
		renderData(reserves, reservesContainer);
	}
}

function buildCardContainer() {

	// container for the cards
	const cardContainer = document.createElement('div');
	cardContainer.classList.add('data-cardContainer');
	return { cardContainer };
}

function renderData(data, cardContainer) {

	// clear before running
	cardContainer.innerHTML = '';

	// If data is an object (but not null), convert it to an array
	if (typeof data === 'object' && data !== null) {
		data = Object.values(data);
	}
	let firstAvailableImage = null;

	// create the cards for each data item
	data.forEach((item, index) => {
		const card = document.createElement('div');
		card.classList.add('data-card');

		cardContainer.appendChild(card);
		const pokeImg = document.createElement('img');
		pokeImg.classList.add('pokeImg');
		// image error handling because API inconsistency >.<
		if (item.sprites.front_default) {
			pokeImg.src = item.sprites.front_default;

			// Update firstAvailableImage when you find the first image URL
			if (!firstAvailableImage) {
				firstAvailableImage = item.sprites.front_default;
			}
		} else {
			// Use firstAvailableImage as the default image URL
			pokeImg.src = firstAvailableImage;
		}
		// pokeImg.src = item.sprites.front_default;
		console.log('img src=', pokeImg.src);

		let pokemonName = document.createElement('h3');
		pokemonName.textContent = index + ': ' + item.name;

		const pokemonDisplay = document.createElement('div');
		pokemonDisplay.classList.add('pokemon-display');
		pokemonDisplay.appendChild(pokemonName);
		pokemonDisplay.appendChild(pokeImg);

		card.appendChild(pokemonDisplay);

		const abilityContainer = document.createElement('div');
		abilityContainer.classList.add('ability-container');

		item.abilities.forEach(ability => {
			if (ability && ability.ability) {
				let abilityInfo = document.createElement('p');
				abilityInfo.textContent = ability.ability.name;
				abilityContainer.appendChild(abilityInfo);
			}
		});
		// add buttons to the cards
		const teamContainer = document.querySelector('.team-container');
		if (teamContainer) {
			console.log('creating remove button');
			const removeButton = document.createElement('button');
			removeButton.classList.add('remove-btn');
			removeButton.textContent = '-';
			abilityContainer.appendChild(removeButton);
			removeButton.addEventListener('pointerdown', function () {
				delete team[item.name];
				localStorage.setItem('team', JSON.stringify(team));
				console.log('team:', team);
				card.remove();
			});
		}

		if (!teamContainer) {
			const addButton = document.createElement('button');
			addButton.classList.add('add-btn');
			addButton.textContent = '+';
			abilityContainer.appendChild(addButton);
			addButton.addEventListener('pointerdown', function () {
				team[item.name] = item;
				localStorage.setItem('team', JSON.stringify(team));
				console.log('team:', team);
				card.remove();
			});
		}

		card.appendChild(abilityContainer);

	});
	return cardContainer;
}

// function switchCard(cardContainer, direction) {
// 	const cards = Array.from(cardContainer.querySelectorAll('.data-card'));
// 	const currentCardIndex = cards.findIndex(card => card.style.display !== 'none');
// 	let nextCardIndex = currentCardIndex + direction;

// 	let filteredEndpoints = Object.values(storedEndpoints).filter(pokemon => pokemon.name.includes(searchInput.value));

// 	if (nextCardIndex < 0) {
// 		nextCardIndex = filteredEndpoints.length - 1; // Wrap around to the last card
// 	} else if (nextCardIndex >= filteredEndpoints.length) {
// 		nextCardIndex = 0; // Wrap around to the first card
// 	}

// 	cards[currentCardIndex].style.display = 'none';
// 	cards[nextCardIndex].style.display = 'block';
// 	console.log('siwtching cards.');
// }

