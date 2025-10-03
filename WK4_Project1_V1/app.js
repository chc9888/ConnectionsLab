let stateData = {}; // empty object is a box to fill with things like an array
let currentState = ''; //variable to know which state is selected and show only that state info

// Load data from JSON file
//idk if its beter to use await function
async function loadData() {
    // try to load the JSON file
    try {
        // fetch = request the JSON from the server 
        //await waits until the file is retrieved
        // the retrieved file is stored in the response variable
        const response = await fetch('data.json');
        //if the file was not loaded shows error
        if (!response.ok) {
            throw new Error('Failed to load data');
        }
        //transforms data to a JS object and store it in the stateData global variable  
        stateData = await response.json();
        console.log('Data loaded');
        console.log('Available states:', Object.keys(stateData)); //show the states that loaded
        //returns data to be able to use it
        return stateData;
        // if trying to load the JSON file fails it shows error
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

// Populate dropdown with states from JSON
function populateDropdown() {
    //get dropdown component by states id in the HTML
    const dropdown = document.getElementById('states');
    //get states from JSON
    const stateKeys = Object.keys(stateData);

    // Loop through each state, kind of like a for loop
    stateKeys.forEach(key => {
        //Create option for the dropdown
        const option = document.createElement('option');
        //Asign the state value to the option
        option.value = key;
        //Asign display text
        option.textContent = stateData[key].name;
        //add option to the dropdown, kind of like a push
        dropdown.appendChild(option);
    });
}

// Function to handle dropdown state change
function handleStateChange(stateName) {
    if (!stateName) {
        // Hide content if no state is selected
        document.getElementById('state-content').style.display = 'none';
        return;
    }
    // Load the content about the selected state
    currentState = stateName;
    loadStateContent(stateName);
}

// Function to load state content dynamically it updates everything when a user selects a state
// Gets the state name from the handle state change function 
function loadStateContent(stateName) {
    // Get the selected state data from the stateData object (from the JSON) and store it in the state variable
    const state = stateData[stateName];
    // Get state content container from HTML by the state-content id
    const contentArea = document.getElementById('state-content');
    // Define container as flex instead of none
    contentArea.style.display = 'flex';
    // Get state description container from HTML by the state-description id
    // Update state description text
    document.getElementById('state-description').textContent = state.info;
    // Create places buttons
    loadPlaces(state.places);
    // Create dishes buttons
    loadDishes(state.dishes);
    // Load map
    updateMap(state);
    // Hide image containers when you switch state 
    document.getElementById('place-display').style.display = 'none';
    document.getElementById('dish-display').style.display = 'none';
}

// Function to load places dynamically
function loadPlaces(places) {
    // Get places container from the HTML with the places-container id
    const container = document.getElementById('places-container');
    // Clear previous places when you change state 
    container.innerHTML = '';
    // Loop through each place, like a for loop
    places.forEach(place => {
        //create button element but not in the HTML yet 
        const placeBtn = document.createElement('button');
        //set button type
        placeBtn.type = 'button';
        //set button text to the place name
        placeBtn.textContent = place.name;
        //Tell the button to show the place when clicked
        placeBtn.onclick = () => showPlace(place, placeBtn);
        //Add button to the HTML container 
        container.appendChild(placeBtn);
    });
}

// Function to load dishes dynamically
function loadDishes(dishes) {
    // Get dishes container from the HTML with the dishes-container id
    const container = document.getElementById('dishes-container');
    // Clear previous places when you change state 
    container.innerHTML = ''; // Clear existing content
    // Loop through each dish, like a for loop
    dishes.forEach(dish => {
        //create button element but not in the HTML yet
        const dishBtn = document.createElement('button');
        //set button type
        dishBtn.type = 'button';
        //set button text to the dish name
        dishBtn.textContent = dish.name;
        //Tell the button to show the dish when clicked
        dishBtn.onclick = () => showDish(dish, dishBtn);
        //Add button to the HTML container
        container.appendChild(dishBtn);
    });
}

// Function to show selected place this is called when the user selects a place from a state
function showPlace(place, buttonElement) {
    // Get HTML containers by id
    const display = document.getElementById('place-display');
    const img = document.getElementById('place-img');
    const title = document.getElementById('place-title');
    const desc = document.getElementById('place-desc');
    // Set image URL from JSON
    img.src = place.image;
    // Set image alt text from JSON
    img.alt = place.name;
    // Set place name text
    title.textContent = place.name;
    // Set place text description from JSON
    desc.textContent = place.description;
    // Set display to flex instead of none
    display.style.display = 'flex';
    // Remove highlight from place buttons for when the user changes state 
    document.querySelectorAll('#places-container button').forEach(btn => {
        btn.classList.remove('active');
    });
    // Highlight only the selected place button
    buttonElement.classList.add('active');
}

// Function to show selected dish this is called when the user selects a dish from a state
function showDish(dish, buttonElement) {
    //get HTML containers by id
    const display = document.getElementById('dish-display');
    const img = document.getElementById('dish-img');
    const title = document.getElementById('dish-title');
    const desc = document.getElementById('dish-desc');
    // Set image URL from JSON
    img.src = dish.image;
    // Set image alt text from JSON
    img.alt = dish.name;
    // Set place name text
    title.textContent = dish.name;
    // Set place text description from JSON
    desc.textContent = dish.description;
    // Set display to flex instead of none
    display.style.display = 'flex';
    // Remove highlight from place buttons for when the user changes state
    document.querySelectorAll('#dishes-container button').forEach(btn => {
        btn.classList.remove('active');
    });
    // Highlight only the selected place button
    buttonElement.classList.add('active');
}

// Function to update map
function updateMap(state) {
    // Get map container from HTML
    const mapContainer = document.getElementById('map-container');
    // Get map URL from JSON and put it inside HTML container
    mapContainer.innerHTML = `<iframe 
            src="${state.mapEmbedUrl}" 
            width="100%" 
            height="300"
            style="border:0;" 
            allowfullscreen="" 
            loading="lazy">
        </iframe>`;
}

// Initialize the page when DOM is ready
//only async functions can use
document.addEventListener('DOMContentLoaded', async function () {
    // Load data first
    await loadData();
    // Populate dropdown with states from the JSON
    populateDropdown();
    console.log('Page initialized');
    // Get state container from HTML and hide it because no state is selected at the beginning 
    document.getElementById('state-content').style.display = 'none';
});