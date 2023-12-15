


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

async function fetchPokemons() {
	try {
		let pokemons = await getData('https://pokeapi.co/api/v2/pokemon?limit=100000');
		localStorage.setItem('pokemons', JSON.stringify(pokemons));
		localStorage.setItem('lastFetchedTime', new Date().toISOString());
	} catch (error) {
		console.error('Error fetching pokemons', error);
	}
}


export { getData, fetchPokemons };
