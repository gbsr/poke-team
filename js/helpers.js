


// ----------------- Pokemon handling ------------------- //

let lastFetchedTime = localStorage.getItem('lastFetchedTime') ? new Date(localStorage.getItem('lastFetchedTime')) : null;
let pokemons = localStorage.getItem('pokemons') ? JSON.parse(localStorage.getItem('pokemons')) : null;

async function getData(URL) {


	if (!pokemons || !lastFetchedTime || new Date() - lastFetchedTime > 3 * 24 * 60 * 1000) {
		return new Promise((resolve, reject) => {

			fetch(URL)
				.then(response => {
					if (!response.ok) {
						throw new Error(`Failed to fetch data. Status: ${response.status}`);
					}
					return response.json();
				})
				.then(data => {
					resolve(data);
				})
				.catch(error => {
					reject(error);
				});
		});
	} else {
		return pokemons;
	}
}

async function fetchPokemons(URL) {
	try {
		let pokemons = await getData(URL);
		localStorage.setItem('pokemons', JSON.stringify(pokemons));
		localStorage.setItem('lastFetchedTime', new Date().toISOString());
	} catch (error) {
		console.error('Error fetching pokemons', error);
	}
}

function createElement(type, className, text) {
	const element = document.createElement(type);
	element.classList.add(className);
	element.textContent = text;
	return element;
}


async function getTeam() {
	try {
		let team = localStorage.getItem('team');

		// If the themes are not in localStorage, fetch them
		if (!team) {
			const response = await fetch('team.json');
			if (!response.ok) {
				throw new Error(`Failed to fetch team. Status: ${response.status}`);
			}
			team = await response.json();

			// Convert the team object into an array of team objects
			team = Object.entries(team).map(([name, values]) => ({ name, values }));

			localStorage.setItem('team', JSON.stringify(team));
		} else {
			// If the themes are in localStorage, parse them
			team = JSON.parse(team);
		}
		return team;
	} catch (error) {
		console.error('Error fetching team:', error);
	}
}

export { getData, fetchPokemons, createElement, getTeam };
