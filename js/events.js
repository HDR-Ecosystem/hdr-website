

const EVENTS_PER_PAGE = 15; // Display 15 events per page (3x5 grid)

let allEvents = [];
let filteredEvents = [];
let currentPage = 1;
let currentFilter = 'all';
let selectedInstitutes = [];
let searchQuery = '';

document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
});

function setupEventListeners() {

    const filterToggle = document.getElementById('filterToggle');
    const filterDropdown = document.getElementById('filterDropdown');
    
    if (filterToggle) {
        filterToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            filterDropdown.classList.toggle('hidden');
        });
    }

    document.addEventListener('click', function(e) {
        if (!filterDropdown.contains(e.target) && !filterToggle.contains(e.target)) {
            filterDropdown.classList.add('hidden');
        }
    });

    const filterOptions = document.querySelectorAll('input[name="eventFilter"]');
    filterOptions.forEach(option => {
        option.addEventListener('change', function() {
            currentFilter = this.value;
            currentPage = 1;
            applyFiltersAndSearch();
        });
    });

    const instituteCheckboxes = document.querySelectorAll('input[name="instituteFilter"]');
    instituteCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            selectedInstitutes = Array.from(
                document.querySelectorAll('input[name="instituteFilter"]:checked')
            ).map(cb => cb.value);
            currentPage = 1;
            applyFiltersAndSearch();
        });
    });

    const searchInput = document.getElementById('eventSearch');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            searchQuery = e.target.value.toLowerCase();
            currentPage = 1;
            applyFiltersAndSearch();
        });
    }
}

function classifyEvent(eventDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const event = parseLocalDate(eventDate);
    event.setHours(0, 0, 0, 0);
    
    return event >= today ? 'upcoming' : 'past';
}

function formatEventDateTime(startDateString, endDateString, timeString = '12:00pm', timezone = 'CT') {
    const startDate = parseLocalDate(startDateString);
    const endDate = endDateString ? parseLocalDate(endDateString) : startDate;

    const startOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    const endOptions = { year: 'numeric', month: 'long', day: 'numeric' };

    const sameDay = startDate.getTime() === endDate.getTime();
    let dateText;

    if (sameDay) {
        dateText = startDate.toLocaleDateString('en-US', startOptions);
    } else if (startDate.getFullYear() === endDate.getFullYear() &&
               startDate.getMonth() === endDate.getMonth()) {
        // Same month/year: April 8–9, 2026
        const monthYear = startDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
        dateText = `${monthYear} ${startDate.getDate()}–${endDate.getDate()}`;
    } else {
        // Different month/year: April 30, 2026 – May 2, 2026
        dateText = `${startDate.toLocaleDateString('en-US', startOptions)} – ${endDate.toLocaleDateString('en-US', endOptions)}`;
    }

    return `${dateText} ${timeString} (${timezone})`;
}

function parseLocalDate(dateString) {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
}

function applyFiltersAndSearch() {
    filteredEvents = allEvents.filter(event => {

        const typeMatch = currentFilter === 'all' || event.type === currentFilter;
        

        const instituteMatch = selectedInstitutes.length === 0 || 
                              selectedInstitutes.includes(event.institute);
        

        const searchableText = event.searchable?.toLowerCase() || '';
        const searchMatch = searchQuery === '' || 
                           searchableText.includes(searchQuery) ||
                           event.title.toLowerCase().includes(searchQuery) ||
                           event.description.toLowerCase().includes(searchQuery);
        
        return typeMatch && instituteMatch && searchMatch;
    });

    currentPage = 1;
    renderEvents();
    renderPagination();
}

function renderEvents() {
    const eventsGrid = document.getElementById('eventsGrid');
    const noEvents = document.getElementById('noEvents');
    
    if (filteredEvents.length === 0) {
        eventsGrid.innerHTML = '';
        noEvents.classList.remove('hidden');
        return;
    }

    noEvents.classList.add('hidden');

    const startIndex = (currentPage - 1) * EVENTS_PER_PAGE;
    const endIndex = startIndex + EVENTS_PER_PAGE;
    const pageEvents = filteredEvents.slice(startIndex, endIndex);

    eventsGrid.innerHTML = '';

    pageEvents.forEach(event => {
        const eventCard = createEventCard(event);
        eventsGrid.appendChild(eventCard);
    });
}

function createEventCard(event) {
    const article = document.createElement('article');
    article.className = 'event-card';
    article.setAttribute('data-event-type', event.type);
    if (event.link) {
        article.classList.add('event-card-linked');
    }

    let eventTypeSection = '';
    if (event.eventType === 'virtual') {
        eventTypeSection = `
            <div class="event-type-info">
                <span class="event-type-badge">
                    <img src="../images/online.png" alt="Virtual" class="event-type-icon" />
                    <span class="event-type-text">Virtual</span>
                </span>
            </div>
        `;
    } else if (event.location) {
        eventTypeSection = `
            <div class="event-type-info">
                <span class="event-location">
                    <img src="../images/location icon.png" alt="Location" class="location-icon" />
                    <span class="location-text">${event.location}</span>
                </span>
            </div>
        `;
    }

    article.innerHTML = `
        <div class="event-image">
            <img src="${event.image}" alt="${event.title}" />
            ${event.link ? `
                <a class="event-image-overlay" href="${event.link}" target="_blank" rel="noopener noreferrer">
                    <span>Read more on external site →</span>
                </a>
            ` : ''}
        </div>
        <div class="event-content">
            <h3>${event.title}</h3>
            <p class="event-datetime">${event.dateTime}</p>
            <p class="event-description">${event.description}</p>
            ${eventTypeSection}
        </div>
    `;

    return article;
}

function renderPagination() {
    const pagination = document.getElementById('pagination');
    const totalPages = Math.ceil(filteredEvents.length / EVENTS_PER_PAGE);

    pagination.innerHTML = '';

    if (totalPages <= 1) return;

    const prevBtn = document.createElement('button');
    prevBtn.className = 'pagination-btn';
    prevBtn.textContent = 'Prev';
    prevBtn.disabled = currentPage === 1;
    prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderEvents();
            renderPagination();
            scrollToTop();
        }
    });
    pagination.appendChild(prevBtn);

    for (let i = 1; i <= totalPages; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = `pagination-btn ${i === currentPage ? 'active' : ''}`;
        pageBtn.textContent = i;
        pageBtn.addEventListener('click', () => {
            currentPage = i;
            renderEvents();
            renderPagination();
            scrollToTop();
        });
        pagination.appendChild(pageBtn);
    }

    const nextBtn = document.createElement('button');
    nextBtn.className = 'pagination-btn';
    nextBtn.textContent = 'Next';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            renderEvents();
            renderPagination();
            scrollToTop();
        }
    });
    pagination.appendChild(nextBtn);
}

function scrollToTop() {
    const eventsList = document.querySelector('.events-list');
    if (eventsList) {
        eventsList.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

window.populateEvents = function(eventsData) {
    allEvents = eventsData.map(event => {
        const startDate = event.startDate || event.date;
        const endDate = event.endDate || event.date;
        const time = event.time || '12:00pm';
        const timezone = event.timezone || 'CT';

        return {
            ...event,
            startDate,
            endDate,
            type: classifyEvent(startDate),
            dateTime: formatEventDateTime(startDate, endDate, time, timezone),
            searchable: `${event.title} ${event.description} ${event.institute || ''}`.toLowerCase()
        };
    });

    currentFilter = 'all';
    currentPage = 1;
    searchQuery = '';
    
    applyFiltersAndSearch();
};

window.getEventsData = function() {
    return {
        allEvents,
        filteredEvents,
        currentPage,
        currentFilter,
        searchQuery
    };
};

document.addEventListener('DOMContentLoaded', function() {
    const sampleEvents = [
        {
            title: 'I-GUIDE VCO: The I-GUIDE Data Ethics Toolkit',
            description: 'This hands-on session will allow you to explore tools from the I-GUIDE Data Ethics Toolkit.',
            date: '2025-12-17',
            time: '11:00am',
            timezone: 'CT',
            image: '../images/i-guide images/iGUIDE banner.jpeg',
            eventType: 'virtual',
            location: 'Online',
            institute: 'I-GUIDE',
            link: 'https://i-guide.io/i-guide-vco/pursuing-ethical-geospatial-data-science-and-ai-the-i-guide-data-ethics-toolkit/'
        },
        {
            title: 'HDR ML Challenge Online Hackathon',
            description: 'Introduction to Codabench,  presentations on the challenges, team formation, and Q&A with organizers.',
            date: '2025-12-18',
            time: '2:00pm',
            timezone: 'ET',
            image: '../images/events page images/Frame 2.png',
            eventType: 'Virtual',
            location: 'Online',
            institute: 'A3D3',
            link: 'https://indico.cern.ch/event/1607943/'
        },
        {
            title: 'FAIR in ML, AI Readiness, & Reproducibility (FARR) Workshop',
            description: 'Focusing on the areas of AI Readiness, AI Reproducibility, and the intersection of the FAIR Principles and ML.',
            startDate: '2026-04-08',
            endDate: '2026-04-09',
            timezone: 'ET',
            image: '../images/events page images/Farr workshop.png',
            eventType: 'in-person',
            location: 'Washington DC',
            institute: 'Community',
            link: 'https://www.farr-rcn.org/workshop26'
        },
    ];

    window.populateEvents(sampleEvents);
});
