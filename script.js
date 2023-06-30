// Define the base URL for your API
const API_BASE_URL = 'https://cook-nuggets.onrender.com';

let currentPage = 1;
let isLoading = false;
let exhaustedPosts = false;

const loadingElement = document.getElementById('loading');
const errorElement = document.getElementById('error');
loadingElement.style.display = 'block';


// Define a function to fetch nuggets from your API
async function fetchNuggets(page = 1) {
    const url = `${API_BASE_URL}/nuggets?page=${page}`;

    try {
    const response = await fetch(url);

        if (!response.ok) {
            throw new Error('Failed to fetch nuggets');
        }

    // Parse the JSON response
    const data = await response.json();

    currentPage ++;

    loadingElement.style.display = 'none';

    return data;
    } catch (error) {
        errorElement.style.display = 'block';
        loadingElement.style.display = 'none';
    }
}

async function fetchStatus() {
    const url = `${API_BASE_URL}/getStatus`;
    const response = await fetch(url);

    const data = await response.json();

    return data;
}

async function loadMoreNuggets() {
    if (isLoading) {
        return;
    }
    isLoading = true;

    const nuggets = await fetchNuggets(currentPage);
    if (nuggets.length < 20) {
        exhaustedPosts = true;
    }
    currentPage++;
    isLoading = false;

    return nuggets;
}

// fetch nuggets and status
fetchNuggets().then(data => {formatPosts(data);});
fetchStatus().then(data => formatStatus(data));

function formatPosts(data) {
    for (let i = 0; i < data.length; i++) {
        let entry = data[i];
        let link = "";

        if (entry.link) {
            link = `<a href="${entry.links}" target="_blank">📎</a>`
        }

        if (!entry.private) {
            $(`<div class="entry"> 
                        <div class="tweet">` + entry.nug + `</div> 
                        <div class="date">` + link + ` ` + entry.date + `</div> 
                    </div>`)
                .appendTo("#table");
        }
    }
}

function formatStatus(data) {
    $(`<div class="status"> <b><a href="https://www.aliciaguo.com/" target="_blank">alicia</a></b> is ` + data.status + `
                    </div><br>`)
        .appendTo("#status");

    $(`<div class="mood"> <b>mood</b>: ` + data.mood + `
                    </div>`)
        .appendTo("#status");

    $(`<div class="nugget"> <b>in the oven</b>: ` + data.nugget + `
                    </div>`)
        .appendTo("#nugget");

    $(`<div class="note"> <b>note</b>: ` + data.note + `
                    </div>`)
        .appendTo("#note");
}


function isAtBottom() {
    console.log("WE NEED MORE POSTS");
    const scrollThreshold = 100; 
    return window.innerHeight + window.scrollY >= document.body.offsetHeight - scrollThreshold;
}

function handleScroll() {
    if (isAtBottom() && !isLoading && !exhaustedPosts) {
        loadMoreNuggets().then(data => { formatPosts(data); });
    }
}

window.addEventListener('scroll', handleScroll);
