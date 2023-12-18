async function fetchThemes() {
	// because of a bug, we need to manually force the body bg
	const body = document.querySelector('body');
	try {
		let themes = localStorage.getItem('themes');

		// If the themes are not in localStorage, fetch them
		if (!themes) {
			const response = await fetch('themes.json');
			if (!response.ok) {
				throw new Error(`Failed to fetch themes. Status: ${response.status}`);
			}
			themes = await response.json();

			// Convert the themes object into an array of theme objects
			themes = Object.entries(themes).map(([name, values]) => ({ name, values }));

			localStorage.setItem('themes', JSON.stringify(themes));
		} else {
			// If the themes are in localStorage, parse them
			themes = JSON.parse(themes);
		}
		body.style.backgroundColor = "#18181a";
		return themes;


	} catch (error) {
		console.error('Error fetching themes:', error);
	}


}
function setTheme(themeName, themes) {
	return new Promise((resolve, reject) => {
		// Find the theme in the themes array
		const theme = themes.find(t => t.name === themeName);

		if (theme) {
			const root = document.documentElement;
			for (const [key, value] of Object.entries(theme.values)) {
				root.style.setProperty(key, value);
				// console.log(`Root property set: ${key} = ${value}`);
			}
			console.log(`Theme '${themeName}' set`);
			// store it to tretrive it later
			localStorage.setItem('theme', themeName);
			resolve();
		} else {
			console.error(`Theme '${themeName}' not found`);
			reject(`Theme '${themeName}' not found`);
		}
	});
}
// we create the dropdown if it doesn't exist only. Technically it never does until this is run
// the first time, but this is a: good practice, 
// and b: allows us to call this function again, 
// in case we want to dynamically update themes or whatever :)

function createThemeSelector(themes) {
	console.log('themes', themes);
	let dropdown = document.querySelector('.dropdown');
	const header = document.querySelector('.header-content');

	// if theme dropdown not built already, build it and append it to the header
	if (!dropdown) {
		dropdown = document.createElement('div');
		dropdown.classList.add('dropdown');
		header.appendChild(dropdown);

		const placeholder = document.createElement('div');
		placeholder.classList.add('dropdown-placeholder');
		placeholder.textContent = 'Themes';
		dropdown.appendChild(placeholder);

		// build the elements for the theme selector (only if dropdown exists)
		if (themes) {
			themes.forEach((theme, index) => {
				const option = document.createElement('div');
				option.classList.add('dropdown-option');
				option.textContent = theme.name;
				option.addEventListener('pointerdown', function () {

					// switch only if we have a new theme
					const selectedTheme = localStorage.getItem('selectedTheme');
					if (theme.name !== selectedTheme) {

						setTheme(theme.name, themes);
					}
				});
				dropdown.appendChild(option);
			});
		}

		dropdown.addEventListener('pointerdown', function () {
			const options = dropdown.querySelectorAll('.dropdown-option');
			options.forEach(option => {
				option.classList.toggle('dropdown-hover');
			});
			placeholder.classList.toggle('dropdown-hide');
		});

		// dropdown.addEventListener('pointerdown', function () {
		// 	const options = dropdown.querySelectorAll('.dropdown-option');
		// 	options.forEach(option => {
		// 		option.classList.remove('dropdown-hover');
		// 	});
		// });
	}
	return dropdown; // Return the dropdown
}


export { fetchThemes, setTheme, createThemeSelector };
