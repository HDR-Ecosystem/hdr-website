
const EVENTS_PER_PAGE = 15; // Desktop default
const MOBILE_EVENTS_PER_PAGE = 6; // Mobile-only pagination
const HOME_EVENTS_LIMIT = 3;
const Y2_EVENTS_PAGE_PATH = 'html/mlchallenge-y2/events.html';

let allEvents = [];
let filteredEvents = [];
let currentPage = 1;
let currentFilter = 'all';
let currentFormat = 'all';
let selectedInstitutes = [];
let searchQuery = '';
const initialSearchQuery = new URLSearchParams(window.location.search).get('search')?.toLowerCase() || '';
let eventsPerPage = getEventsPerPage();

document.addEventListener('DOMContentLoaded', function() {
    const eventsGrid = document.getElementById('eventsGrid');
    if (!eventsGrid) return;
    setupEventListeners();
});

function getEventsPerPage() {
    return window.matchMedia('(max-width: 600px)').matches
        ? MOBILE_EVENTS_PER_PAGE
        : EVENTS_PER_PAGE;
}

function isExternalLink(url) {
    if (!url) return false;
    if (url.startsWith('mailto:') || url.startsWith('tel:')) return true;
    try {
        const resolved = new URL(url, window.location.href);
        return resolved.origin !== window.location.origin;
    } catch (err) {
        return url.startsWith('http://') || url.startsWith('https://');
    }
}

function formatHomeEventDateRange(startDateString, endDateString) {
    const startDate = parseLocalDate(startDateString);
    const endDate = endDateString ? parseLocalDate(endDateString) : startDate;

    const startOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    const endOptions = { year: 'numeric', month: 'long', day: 'numeric' };

    const sameDay = startDate.getTime() === endDate.getTime();

    if (sameDay) {
        return startDate.toLocaleDateString('en-US', startOptions);
    }

    if (startDate.getFullYear() === endDate.getFullYear() &&
        startDate.getMonth() === endDate.getMonth()) {
        const monthYear = startDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
        return `${monthYear} ${startDate.getDate()}–${endDate.getDate()}`;
    }

    return `${startDate.toLocaleDateString('en-US', startOptions)} – ${endDate.toLocaleDateString('en-US', endOptions)}`;
}

function formatHomeEventDateTime(startDateString, endDateString, timeString, timezone) {
    const dateText = formatHomeEventDateRange(startDateString, endDateString);
    return `${dateText} ${timeString} (${timezone})`;
}

function normalizeHomeEvent(event) {
    const startDate = event.startDate || event.date;
    const endDate = event.endDate || event.date;
    const time = event.time;
    const timezone = event.timezone;
    const normalizedEventType = (event.eventType || '').toLowerCase();
    const hasTime = Boolean(time || timezone);
    const dateText = event.customDateText ||
        (startDate ? (hasTime ? formatHomeEventDateTime(startDate, endDate, time || '12:00pm', timezone || 'CT')
            : formatHomeEventDateRange(startDate, endDate)) : '');

    return {
        ...event,
        startDate,
        endDate,
        eventType: normalizedEventType,
        dateText
    };
}

function isUpcomingHomeEvent(eventDateString) {
    if (!eventDateString) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const eventDate = parseLocalDate(eventDateString);
    eventDate.setHours(0, 0, 0, 0);
    return eventDate >= today;
}

function getHomeEvents(events) {
    const normalized = events
        .map(normalizeHomeEvent)
        .filter(event => event.startDate);

    const upcoming = normalized
        .filter(event => isUpcomingHomeEvent(event.startDate))
        .sort((a, b) => parseLocalDate(a.startDate) - parseLocalDate(b.startDate));

    if (upcoming.length > 0) {
        return upcoming.slice(0, HOME_EVENTS_LIMIT);
    }

    return normalized
        .sort((a, b) => parseLocalDate(b.startDate) - parseLocalDate(a.startDate))
        .slice(0, HOME_EVENTS_LIMIT);
}

function parseHomeEventDateFromLabel(labelText) {
    if (!labelText) return null;
    const match = labelText.match(/Date:\s*([^()]+)/i);
    if (!match) return null;
    let raw = match[1].trim();

    const yearMatch = raw.match(/\b(\d{4})\b/);
    const year = yearMatch ? yearMatch[1] : '';

    if (raw.includes('&')) {
        const month = raw.split(' ')[0];
        const lastPart = raw.split('&').pop().trim();
        const lastDayMatch = lastPart.match(/\d+/);
        const lastDay = lastDayMatch ? lastDayMatch[0] : '';
        raw = `${month} ${lastDay}, ${year}`;
    }

    if (raw.includes('–') || raw.includes('—') || raw.includes('-')) {
        const dashSplit = raw.split(/–|—|-/);
        const lastSegment = dashSplit.pop().trim();
        const monthMatch = lastSegment.match(/[A-Za-z]+/);
        const month = monthMatch ? monthMatch[0] : raw.split(' ')[0];
        const dayMatch = lastSegment.match(/\d+/);
        const day = dayMatch ? dayMatch[0] : '';
        raw = `${month} ${day}, ${year}`;
    }

    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed.toISOString().slice(0, 10);
}

function normalizeY2HomeEvent(item) {
    const titleLink = item.querySelector('a');
    const dateSpan = item.querySelector('.event-date');
    const locationSpan = item.querySelector('.event-location');
    const dateLabel = dateSpan ? dateSpan.textContent.trim() : '';
    const startDate = parseHomeEventDateFromLabel(dateLabel);

    if (!titleLink || !startDate) return null;

    const locationText = locationSpan
        ? locationSpan.textContent.replace(/^[^A-Za-z0-9]+/, '').trim()
        : '';

    return {
        title: titleLink.textContent.trim(),
        description: '',
        date: startDate,
        image: 'images/events_page_images/Frame_2.png',
        eventType: locationSpan && locationSpan.textContent.includes('Online') ? 'virtual' : 'in-person',
        location: locationText,
        link: titleLink.getAttribute('href')
    };
}

async function loadY2HomeEventsFromHtml() {
    try {
        const response = await fetch(Y2_EVENTS_PAGE_PATH, { credentials: 'same-origin' });
        if (!response.ok) return [];
        const htmlText = await response.text();
        const doc = new DOMParser().parseFromString(htmlText, 'text/html');
        const items = Array.from(doc.querySelectorAll('details ul li'));
        return items
            .map(normalizeY2HomeEvent)
            .filter(Boolean);
    } catch (err) {
        return [];
    }
}

function dedupeHomeEvents(events) {
    const seen = new Set();
    return events.filter(event => {
        const key = `${event.title}::${event.startDate || event.date}::${event.link || ''}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

function renderHomeEvents(events) {
    const container = document.getElementById('home-events-container');
    if (!container) return;

    container.innerHTML = '';

    events.forEach(event => {
        const isExternal = isExternalLink(event.link);
        const linkAttrs = isExternal ? 'target="_blank" rel="noopener noreferrer"' : '';
        const locationText = event.eventType === 'virtual'
            ? 'Virtual'
            : (event.location || 'Location TBD');
        const locationIcon = event.eventType === 'virtual'
            ? 'images/online.png'
            : 'images/Location_icon.png';

        container.insertAdjacentHTML('beforeend', `
            <a class="event-link" href="${event.link || '#'}" ${linkAttrs}>
                <div class="event-item">
                    <h4>${event.title}</h4>
                    <p class="event-date">${event.dateText}</p>
                    <div class="event-location">
                        <img src="${locationIcon}" alt="Location" class="location-icon">
                        <span>${locationText}</span>
                    </div>
                </div>
            </a>
        `);
    });
}

function setupEventListeners() {

    const filterToggle = document.getElementById('filterToggle');
    const filterDropdown = document.getElementById('filterDropdown');
    
    if (filterToggle) {
        filterToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            filterDropdown.classList.toggle('hidden');
        });
    }

    if (filterDropdown && filterToggle) {
        document.addEventListener('click', function(e) {
            if (!filterDropdown.contains(e.target) && !filterToggle.contains(e.target)) {
                filterDropdown.classList.add('hidden');
            }
        });
    }

    const filterOptions = document.querySelectorAll('input[name="eventFilter"]');
    filterOptions.forEach(option => {
        option.addEventListener('change', function() {
            currentFilter = this.value;
            currentPage = 1;
            applyFiltersAndSearch();
        });
    });

    const formatOptions = document.querySelectorAll('input[name="eventFormat"]');
    formatOptions.forEach(option => {
        option.addEventListener('change', function() {
            currentFormat = this.value;
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

    window.addEventListener('resize', () => {
        const nextPerPage = getEventsPerPage();
        if (nextPerPage !== eventsPerPage) {
            eventsPerPage = nextPerPage;
            currentPage = 1;
            renderEvents();
            renderPagination();
        }
    });
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
    const selectedLower = selectedInstitutes.map(i => i.toLowerCase());

    const nextFiltered = allEvents.filter(event => {

        const typeMatch = currentFilter === 'all' || event.type === currentFilter;
        const formatMatch = currentFormat === 'all' || event.eventType === currentFormat;

        const eventInstitutes = (event.institute || '')
            .split(',')
            .map(i => i.trim().toLowerCase())
            .filter(Boolean);
        const isCommunity = eventInstitutes.includes('community');
        const instituteMatch = isCommunity
            ? true
            : selectedLower.length === 0 ||
              eventInstitutes.some(inst => selectedLower.includes(inst));

        const searchableText = event.searchable?.toLowerCase() || '';
        const searchMatch = searchQuery === '' || 
                           searchableText.includes(searchQuery) ||
                           event.title.toLowerCase().includes(searchQuery) ||
                           event.description.toLowerCase().includes(searchQuery);
        
        return typeMatch && formatMatch && instituteMatch && searchMatch;
    });

    const unchanged = filteredEvents.length === nextFiltered.length &&
        filteredEvents.every((evt, idx) => evt === nextFiltered[idx]);

    filteredEvents = nextFiltered;

    if (unchanged) return;

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

    const startIndex = (currentPage - 1) * eventsPerPage;
    const endIndex = startIndex + eventsPerPage;
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
                    <img src="../images/Location_icon.png" alt="Location" class="location-icon" />
                    <span class="location-text">${event.location}</span>
                </span>
            </div>
        `;
    }

    const isExternal = isExternalLink(event.link);
    const linkAttrs = isExternal ? 'target="_blank" rel="noopener noreferrer"' : '';
    const readMoreLabel = isExternal ? 'Read more on external site \u2192' : 'Read more \u2192';
    const readMoreMarkup = event.link
        ? `<span class="event-read-more-overlay" aria-hidden="true">${readMoreLabel}</span>`
        : '';
    const titleMarkup = event.link
        ? `<a class="event-title-link" href="${event.link}" ${linkAttrs}>${event.title}</a>`
        : `${event.title}`;
    const imageMarkup = event.link
        ? `<a class="event-image-link" href="${event.link}" ${linkAttrs} aria-label="Open event details for ${event.title}">
                <img src="${event.image}" alt="${event.title}" />
                ${readMoreMarkup}
           </a>`
        : `<img src="${event.image}" alt="${event.title}" />`;

    article.innerHTML = `
        <div class="event-image">
            ${imageMarkup}
        </div>
        <div class="event-content">
            <h3>${titleMarkup}</h3>
            <p class="event-datetime">${event.dateTime}</p>
            <p class="event-description">${event.description}</p>
            ${eventTypeSection}
        </div>
    `;

    return article;
}

function renderPagination() {
    const pagination = document.getElementById('pagination');
    const totalPages = Math.ceil(filteredEvents.length / eventsPerPage);

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
        const normalizedEventType = (event.eventType || '').toLowerCase();

        return {
            ...event,
            eventType: normalizedEventType,
            startDate,
            endDate,
            type: classifyEvent(startDate),
            dateTime: event.customDateText || formatEventDateTime(startDate, endDate, time, timezone),
            searchable: `${event.title} ${event.description} ${event.institute || ''} ${event.location || ''}`.toLowerCase()
        };
    }).sort((a, b) => {
        const aDate = a.startDate ? parseLocalDate(a.startDate).getTime() : 0;
        const bDate = b.startDate ? parseLocalDate(b.startDate).getTime() : 0;
        return bDate - aDate; // newest first
    });

    currentFilter = 'all';
    currentFormat = 'all';
    currentPage = 1;
    searchQuery = initialSearchQuery;

    const searchInput = document.getElementById('eventSearch');
    if (searchInput && initialSearchQuery) {
        searchInput.value = initialSearchQuery;
    }
    
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
    const eventsData = [
        {
            title: 'I-GUIDE VCO: The I-GUIDE Data Ethics Toolkit',
            description: 'This hands-on session will allow you to explore tools from the I-GUIDE Data Ethics Toolkit.',
            date: '2025-12-17',
            time: '11:00am',
            timezone: 'CT',
            image: '../images/i-guide_images/iGUIDE_banner.jpeg',
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
            image: '../images/events_page_images/Frame_2.png',
            eventType: 'Virtual',
            location: 'Virtual',
            institute: 'A3D3, Imageomics, iHARP',
            link: 'https://indico.cern.ch/event/1607943/'
        },
        {
            title: 'FAIR in ML, AI Readiness, & Reproducibility (FARR) Workshop',
            description: 'Focusing on the areas of AI Readiness, AI Reproducibility, and the intersection of the FAIR Principles and ML.',
            startDate: '2026-04-08',
            endDate: '2026-04-09',
            timezone: 'ET',
            image: '../images/events_page_images/FARR_Workshop.png',
            eventType: 'in-person',
            location: 'Washington DC',
            institute: 'A3D3, Imageomics, iHARP',
            link: 'https://www.farr-rcn.org/workshop26'
        },
        {
            title: 'NEON/ESIIL Hackathon ',
            description: 'This event will provide an introduction to the NSF Harnessing the Data Revolution (HDR) ML Challenge.',
            startDate: '2025-12-12',
            endDate: '2025-12-15',
            time: '8:00am - 5:00pm',
            timezone: 'MST',
            image: '../images/events_page_images/NEONESIIL_Hackathon.jpeg',
            eventType: 'in-person',
            location: 'Boulder, CO',
            institute: 'A3D3, Imageomics, iHARP',
            customDateText: 'December 12 & 15, 2025 • 8:00am - 5:00pm (MST)',
            link: 'https://docs.google.com/forms/d/e/1FAIpQLSd-K2hu1g4xxc3Fxj0qPoGDOVt_T-sWw7TSgEtEkPZUlAA6Cg/viewform'
        },
        {
            title: 'HDR Hackathon Taiwan',
            description: 'This online briefing will provide participants in Taiwan with an overview of the 2025 NSF HDR Hackathon.',
            date: '2025-12-19',
            time: '12:00pm',
            timezone: 'CST (台湾时间) / 11:00pm ET',
            image: '../images/events_page_images/HDR_Hackathon_Taiwan.png',
            eventType: 'virtual',
            location: 'Taiwan',
            institute: 'A3D3, Imageomics, iHARP',
            customDateText: 'December 19, 2025 • 12:00pm (CST - 台湾时间) / 11:00pm (ET)',
            link: 'https://indico.cern.ch/event/1610056/'
        },
        {
            title: 'UW A3D3 & NSF HDR Hackathon',
            description: 'Work with teams and expert consultants to complete a submission for one of the challenges.',
            startDate: '2026-01-10',
            endDate: '2026-01-10',
            time: '9:00am - 7:00pm',
            timezone: 'PST',
            image: '../images/events_page_images/UW_A3D3_&_NSF_HDR_Challenge_Hackathon.jpg',
            eventType: 'in-person',
            location: 'Seattle, WA',
            institute: 'A3D3, Imageomics, iHARP',
            customDateText: 'January 10, 2026 • 9:00am - 7:00pm (PST)',
            link: 'https://indico.cern.ch/event/1604685/overview'
        },
        {
            title: 'Imageomics 2026 All-hands Meeting',
            description: 'Discover how the Imageomics Institute bridges biology and AI to revolutionize our understanding of life.',
            startDate: '2026-04-14',
            endDate: '2026-04-16',
            image: '../images/events_page_images/Imageomics_2026_All-hands_Meeting.jpg',
            eventType: 'in-person',
            location: 'Columbus, OH',
            institute: 'Imageomics',
            customDateText: 'April 14-16, 2026',
            link: 'https://imageomics.osu.edu/allhands'
        },
        {
            title: 'ID4 All Hands Meeting + AI for Engineering Workshop',
            description: 'This event brings together leading researchers working across mechanics, materials, structures, and computation.',
            startDate: '2026-05-13',
            endDate: '2026-05-14',
            image: '../images/events_page_images/ID4_all_hands_meeting.JPG',
            eventType: 'in-person',
            location: 'Princeton, NJ',
            institute: 'ID4',
            customDateText: 'May 13-14, 2026',
            link: 'https://id4.mines.edu/ai-for-engineering/'
        },
        {
            title: 'AAG 2026 Symposium',
            description: 'AAG 2026 Symposium on Spatial  AI and Data Science: Frontiers and Applications, will be hosted by I-GUIDE.',
            startDate: '2026-03-24',
            endDate: '2026-03-28',
            image: '../images/events_page_images/AAG-Globe-Meridian-SpaceAAG_2026_Symposium_on_Spatial_AI_and_Data_Science_Frontiers_and_Applications-AAG2024-1.jpg',
            eventType: 'in-person',
            location: 'San Fransciso, CA',
            institute: 'I-GUIDE',
            customDateText: 'March 24–28, 2026',
            link: 'https://i-guide.io/aag-2026-symposium-on-spatial-ai-data-science-frontiers-and-applications/'
        },
        {
            title: 'I-GUIDE Forum 2026 & HDR Ecosystem Conference',
            description: 'This joint conference will bring together  researchers to shape the future of AI and data-intensive sciences.',
            startDate: '2026-08-03',
            endDate: '2026-08-07',
            image: '../images/events_page_images/I-GUIDE_Forum_2026_&_HDR_Community_Conference.jpg',
            eventType: 'in-person',
            location: 'Chicago, IL',
            institute: 'community',
            customDateText: 'August 3–7, 2026',
            link: 'https://i-guide.io/forum/forum-2026/'
        },
        {
            title: 'ML Challenge Online Hackathon & Organizer Training Workshop',
            description: 'How to host a successful hackathon + Q&A and challenge introductions.',
            date: '2025-10-31',
            time: '12:00pm - 5:00pm',
            timezone: 'ET',
            image: '../images/events_page_images/ML_Challenge_Online_Hackathon_&_Organizer_Training_Workshop.png',
            eventType: 'virtual',
            location: 'Virtual',
            institute: 'A3D3, Imageomics, iHARP',
            customDateText: 'October 31, 2025 • 12:00pm - 5:00pm (ET)',
            link: 'https://indico.cern.ch/event/1607943/'
        },
        {
            title: 'HDR Ecosystem Conference 2025',
            description: 'This conference united researchers, and students to share breakthroughs and chart a bold data-rich future.',
            startDate: '2025-09-16',
            endDate: '2025-09-19',
            image: '../images/events_page_images/HDR_Ecosystem_Conference_2025.jpg',
            eventType: 'in-person',
            location: 'Columbus, OH',
            institute: 'community',
            customDateText: 'September 16–19, 2025',
            link: '/html/2025-hdr-conference.html'
        },
        {
            title: 'AAAI Workshop',
            description: 'Anomaly detection workshop serving as the award ceremony for the 1st HDR Interdisciplinary ML Challenge.',
            date: '2025-03-04',
            time: '9:00am - 6:00pm',
            timezone: 'ET',
            image: '../images/events_page_images/AAAI_Workshop.png',
            eventType: 'in-person',
            location: 'Philadelphia, PA',
            institute: 'community',
            customDateText: 'March 4, 2025 • 9:00am - 6:00pm (ET)',
            link: '/html/mlchallenge-y1/aaai-workshop2024.html'
        },
        {
            title: '2024 National Diversity in STEM Conference (SACNAS)',
            description: 'The SACNAS Annual Conference is the leading multidisciplinary and multicultural STEM conference',
            startDate: '2024-10-31',
            endDate: '2024-11-02',
            image: '../images/events_page_images/2024_National_Diversity_in_STEM_Conference_(SACNAS).jpeg',
            eventType: 'in-person',
            location: 'Phoenix, AZ',
            institute: 'community',
            customDateText: 'October 31 – November 2, 2024',
            link: 'https://www.sacnas.org/ndistem2024'
        },
        {
            title: 'HDR Ecosystem Conference 2024',
            description: 'This conference showcased goals, plans, accomplishments and opportunities of the HDR ecosystem.',
            startDate: '2024-09-09',
            endDate: '2024-09-12',
            image: '../images/events_page_images/HDR_Ecosystem_Conference_2024.jpg',
            eventType: 'in-person',
            location: 'Champaign, IL',
            institute: 'community',
            customDateText: 'September 9–12, 2024',
            link: 'https://hdr-ecosystem.github.io/hdr2024/'
        },
        {
            title: '2023 National Diversity in STEM Conference (SACNAS) ',
            description: 'SACNAS celebrated their 50th Anniversary with a record breaking over 6,000 people from all STEM disciplines.',
            startDate: '2023-10-26',
            endDate: '2023-10-28',
            image: '../images/events_page_images/2023_NDiSTEM_Conference.png',
            eventType: 'in-person',
            location: 'Portland, OR',
            institute: 'community',
            customDateText: 'October 26–28, 2023',
            link: 'https://www.sacnas.org/ndistem2023'
        },
        {
            title: 'HDR Ecosystem Conference 2023 ',
            description: 'The conference reflected on progress, shared best practices, and addressed data-intensive research challenges.',
            startDate: '2023-10-16',
            endDate: '2023-10-18',
            image: '../images/events_page_images/2023_HDR_Ecosystem_Conference.jpeg',
            eventType: 'in-person',
            location: 'Denver, CO',
            institute: 'community',
            customDateText: 'October 16–18, 2023',
            link: 'https://id4.mines.edu/hdr-conference/'
        },
        {
            title: '2023 HDR Postbaccalaureate Workshop',
            description: 'This workshop brought together HDR postbaccalaureate fellows to present, and learn about data science research.',
            startDate: '2023-06-20',
            endDate: '2023-06-21',
            image: '../images/events_page_images/2023_HDR_Postbaccalaureate_Workshop.jpg',
            eventType: 'in-person',
            location: 'San Diego, CA',
            institute: 'community',
            customDateText: 'June 20–21, 2023',
            link: 'https://indico.cern.ch/event/1253923/'
        },
        {
            title: '2022 HDR From Harnessing to Harvesting the Data Revolution',
            description: 'The first HDR Principal Investigator meetings, were the members of the NSF HDR ecosystem were assembled.',
            startDate: '2022-10-26',
            endDate: '2022-10-27',
            image: '../images/events_page_images/HDR_Ecosystem_Conference_2022.png',
            eventType: 'in-person',
            location: 'Alexandria, VA',
            institute: 'community',
            customDateText: 'October 26–27, 2022',
            link: 'https://indico.cern.ch/event/1174814/overview'
        }
    ];

    window.HDR_EVENTS = eventsData;

    const eventsGrid = document.getElementById('eventsGrid');
    if (eventsGrid) {
        window.populateEvents(eventsData);
    }

    const homeEventsContainer = document.getElementById('home-events-container');
    if (homeEventsContainer) {
        (async () => {
            const y2Events = await loadY2HomeEventsFromHtml();
            const combined = dedupeHomeEvents([...window.HDR_EVENTS, ...y2Events]);
            const events = getHomeEvents(combined);
            renderHomeEvents(events);
        })();
    }
});
