// Google Sheet configuration
const SPREADSHEET_ID = '1GqJQBwb5UnbLv4RZX-_rXvW3cLBEP4hR9FlsrvKygIE';
// These URLs will be different - you'll need to replace them with the ones from "Publish to Web"
const NUGGETS_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSncQqbARMiODGw8O84cbmcPuNiSwMZcUTKWfKJqlZWKbGf1Iwhs8DxSb2H798Tw3Ft__G7zUSTFEO-/pub?gid=2008578927&single=true&output=csv';
const STATUS_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSncQqbARMiODGw8O84cbmcPuNiSwMZcUTKWfKJqlZWKbGf1Iwhs8DxSb2H798Tw3Ft__G7zUSTFEO-/pub?gid=534908844&single=true&output=csv';

let currentPage = 1;
let isLoading = false;
let exhaustedPosts = false;
const PAGE_SIZE = 20;

const loadingElement = document.getElementById('loading');
const errorElement = document.getElementById('error');
loadingElement.style.display = 'block';

// Cache for parsed data
let cachedData = null;
let isInitialLoad = true;

// Convert Google Drive URL to direct image URL
function getDirectImageUrl(driveUrl) {
  if (!driveUrl) return null;
  
  // If it's already a direct URL (starts with http), return it as is
  if (driveUrl.startsWith('http')) {
    return driveUrl;
  }
  
  // If it's a Google Drive URL, convert it
  if (driveUrl.includes('drive.google.com')) {
    // Extract the file ID from the Google Drive URL
    const fileId = driveUrl.match(/[-\w]{25,}/);
    if (!fileId) return null;
    
    // Return the direct image URL
    const directUrl = `https://drive.google.com/thumbnail?id=${fileId[0]}&sz=w1000`;
    return directUrl;
  }
  
  return null;
}

// Format date to remove time portion if it exists
function formatDate(dateStr) {
  if (!dateStr) return '';
  // Split by space and take only the date part
  return dateStr.split(' ')[0];
}

// Parse date string into Date object for sorting
function parseDate(dateStr) {
  if (!dateStr) return new Date(0); // Return earliest date if no date provided
  const [datePart, timePart] = dateStr.split(' ');
  const [month, day, year] = datePart.split('/');
  if (timePart) {
    const [hours, minutes, seconds] = timePart.split(':');
    return new Date(year, month - 1, day, hours, minutes, seconds);
  }
  return new Date(year, month - 1, day);
}

// Define a function to fetch nuggets from Google Sheets CSV
async function fetchNuggets(page = 1) {
  try {
    // If we have cached data, use it
    if (cachedData) {
      const startIndex = (page - 1) * PAGE_SIZE;
      const endIndex = startIndex + PAGE_SIZE;
      const pageNuggets = cachedData.slice(startIndex, endIndex);
      
      currentPage++;
      loadingElement.style.display = 'none';

      if (pageNuggets.length < PAGE_SIZE) {
        exhaustedPosts = true;
      }

      return pageNuggets;
    }

    // Show loading state on initial load
    if (isInitialLoad) {
      loadingElement.style.display = 'block';
      isInitialLoad = false;
    }

    const response = await fetch(NUGGETS_CSV_URL);
    const csvText = await response.text();
    
    // Parse CSV with proper handling of newlines
    const rows = [];
    let currentRow = [];
    let currentField = '';
    let inQuotes = false;
    
    for (let i = 0; i < csvText.length; i++) {
      const char = csvText[i];
      const nextChar = csvText[i + 1];
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Handle escaped quotes
          currentField += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        currentRow.push(currentField.trim());
        currentField = '';
      } else if (char === '\n' && !inQuotes) {
        // Add the current field to the row
        currentRow.push(currentField.trim());
        // Only add the row if it has data
        if (currentRow.some(field => field.trim())) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }
    
    // Add the last field and row if there's any remaining data
    if (currentField.trim()) {
      currentRow.push(currentField.trim());
    }
    if (currentRow.length > 0 && currentRow.some(field => field.trim())) {
      rows.push(currentRow);
    }
    
    // Remove header row
    rows.shift();
    
    // Reverse the array to get newest entries first (since sheet is in chronological order)
    rows.reverse();
    
    // Cache the processed data
    cachedData = rows.map(row => {
      // Ensure row has all required fields

      const [date, nug, links, visibility, image] = row;

      return {
        nug: nug || '', // B: post
        links: links || '', // C: links
        private: visibility?.toLowerCase() !== '✅ public', // D: visibility
        date: formatDate(date || ''), // A: timestamp, formatted to remove time
        image: getDirectImageUrl(image || '') // E: image URL from Google Drive or direct link
      };
    });

    const startIndex = (page - 1) * PAGE_SIZE;
    const endIndex = startIndex + PAGE_SIZE;
    const pageNuggets = cachedData.slice(startIndex, endIndex);

    currentPage++;
    loadingElement.style.display = 'none';

    if (pageNuggets.length < PAGE_SIZE) {
      exhaustedPosts = true;
    }

    return pageNuggets;
  } catch (error) {
    errorElement.style.display = 'block';
    loadingElement.style.display = 'none';
    console.error('Error fetching nuggets:', error);
  }
}

async function fetchStatus() {
  try {
    const response = await fetch(STATUS_CSV_URL);
    const csvText = await response.text();
    
    // Parse CSV with proper handling of quoted fields
    const rows = [];
    let currentRow = [];
    let currentField = '';
    let inQuotes = false;
    
    for (let i = 0; i < csvText.length; i++) {
      const char = csvText[i];
      const nextChar = csvText[i + 1];
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Handle escaped quotes
          currentField += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        currentRow.push(currentField.trim());
        currentField = '';
      } else if (char === '\n' && !inQuotes) {
        // Add the current field to the row
        currentRow.push(currentField.trim());
        // Add the row regardless of content
        rows.push(currentRow);
        currentRow = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }
    
    // Add the last field and row if there's any remaining data
    if (currentField.trim()) {
      currentRow.push(currentField.trim());
    }
    if (currentRow.length > 0) {
      rows.push(currentRow);
    }
    
    // Remove header row and any completely empty rows
    rows.shift();
    const filteredRows = rows.filter(row => row.some(field => field.trim()));
    
    const statusData = {};
    filteredRows.forEach(row => {
      if (row[0] && row[1]) {
        // Remove any surrounding quotes from the value
        statusData[row[0]] = row[1].replace(/^"|"$/g, '');
      }
    });

    return statusData;
  } catch (error) {
    console.error('Error fetching status:', error);
    return {
      status: 'unknown',
      mood: 'unknown',
      cooking: 'unknown',
      note: 'unknown'
    };
  }
}

async function loadMoreNuggets() {
  if (isLoading) {
    return;
  }
  isLoading = true;

  const nuggets = await fetchNuggets(currentPage);
  isLoading = false;

  return nuggets;
}

function formatPosts(data) {
  for (let i = 0; i < data.length; i++) {
    let entry = data[i];
    let link = "";
    let image = "";

    // Check if links exists and is not empty
    if (entry.links && entry.links.trim()) {
      link = `<a href="${entry.links.trim()}" target="_blank">📎</a>`;
    }

    if (entry.image && entry.image.trim()) {
      image = `<img class="img" src="${entry.image.trim()}">`;
    }

    // Show all entries for now
    $(`<div class="entry"> 
      <div class="tweet">` + entry.nug.replace(/\n/g, '<br>') + `</div>`
      + image + ` 
      <div class="date">${link} ${entry.date}</div>
    </div>`)
      .appendTo("#table");
  }
}

function formatStatus(data) {
  $(`<div class="status"> <b><a href="https://www.aliciaguo.com/" target="_blank">alicia</a></b> is ` + data.status + `
    </div><br>`)
    .appendTo("#status");

  $(`<div class="mood"> <b>mood</b>: ` + data.mood + `
    </div>`)
    .appendTo("#status");

  $(`<div class="nugget"> <b>in the oven</b>: ` + data.cooking + `
    </div>`)
    .appendTo("#nugget");

  $(`<div class="note"> <b>note</b>: ` + data.note + `
    </div>`)
    .appendTo("#note");
}

function isAtBottom() {
  const scrollThreshold = 100; 
  return window.innerHeight + window.scrollY >= document.body.offsetHeight - scrollThreshold;
}

function handleScroll() {
  if (isAtBottom() && !isLoading && !exhaustedPosts) {
    loadMoreNuggets().then(data => { formatPosts(data); });
  }
}

// Initial load
fetchNuggets().then(data => formatPosts(data));
fetchStatus().then(data => formatStatus(data));

window.addEventListener('scroll', handleScroll);
