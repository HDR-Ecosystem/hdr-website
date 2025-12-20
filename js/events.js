

const EVENTS_PER_PAGE = 15; // Display 15 events per page (3x5 grid)

let allEvents = [];
let filteredEvents = [];
let currentPage = 1;
let currentFilter = 'all';
let currentFormat = 'all';
let selectedInstitutes = [];
let searchQuery = '';
const initialSearchQuery = new URLSearchParams(window.location.search).get('search')?.toLowerCase() || '';

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
                    <img src="../images/Location icon.png" alt="Location" class="location-icon" />
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
            image: '../images/events page images/FARR Workshop.png',
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
            image: '../images/events page images/NEONESIIL Hackathon.jpeg',
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
            image: '../images/events page images/HDR Hackathon Taiwan.png',
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
            image: '../images/events page images/UW A3D3 & NSF HDR Challenge  Hackathon.jpg',
            eventType: 'in-person',
            location: 'Seattle, WA',
            institute: 'A3D3, Imageomics, iHARP',
            customDateText: 'January 10, 2026 • 9:00am - 7:00pm (PST)',
            link: 'https://indico.cern.ch/event/1604685/overview'
        },
        {
            title: 'AAG 2026 Symposium',
            description: 'American Association of Geographers 2026 Symposium on Spatial AI and Data Science: Frontiers and Applications, will be hosted and sponsored by I-GUIDE.',
            startDate: '2026-03-24',
            endDate: '2026-03-28',
            image: '../images/events page images/AAG-Globe-Meridian-SpaceAAG 2026 Symposium on Spatial AI and Data Science Frontiers and Applications-AAG2024-1.jpg',
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
            image: '../images/events page images/I-GUIDE Forum 2026 & HDR  Community Conference.jpg',
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
            image: '../images/events page images/ML Challenge Online Hackathon  & Organizer Training Workshop.png',
            eventType: 'virtual',
            location: 'Virtual',
            institute: 'A3D3, Imageomics, iHARP',
            customDateText: 'October 31, 2025 • 12:00pm - 5:00pm (ET)',
            link: 'https://indico.cern.ch/event/1607943/'
        },
        {
            title: 'HDR Ecosystem Conference 2025',
            description: '2025 marked a pivotal convergence in uniting researchers, practitioners, and students to share breakthroughs and chart a bold, data-rich future.', 
            startDate: '2025-09-16',
            endDate: '2025-09-19',
            image: '../images/events page images/HDR Ecosystem Conference 2025.jpg',
            eventType: 'in-person',
            location: 'Columbus, OH',
            institute: 'community',
            customDateText: 'September 16–19, 2025',
            link: 'https://www.nsfhdr.org/events/upcoming-events/hdr-ecosystem-conference'
        },
        {
            title: 'AAAI Workshop',
            description: '1-day workshop that included keynote talks, paper presentations, a poster session, a discussion, and presentations by the ML challenge winner.',
            date: '2025-03-04',
            time: '9:00am - 6:00pm',
            timezone: 'ET',
            image: '../images/events page images/AAAI Workshop.png',
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
            image: '../images/events page images/2024 National Diversity in STEM  Conference (SACNAS).jpeg',
            eventType: 'in-person',
            location: 'Phoenix, AZ',
            institute: 'community',
            customDateText: 'October 31 – November 2, 2024',
            link: 'https://www.sacnas.org/ndistem2024'
        },
        {
            title: 'HDR Ecosystem Conference 2024',
            description: 'The conference worked to share the accomplishments, goals and plans of HDR ecosystem entities, while discussing how to sustain and grow.',
            startDate: '2024-09-09',
            endDate: '2024-09-12',
            image: '../images/events page images/HDR Ecosystem Conference 2024.jpg',
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
            image: '../images/events page images/2023 NDiSTEM Conference.png',
            eventType: 'in-person',
            location: 'Portland, OR',
            institute: 'community',
            customDateText: 'October 26–28, 2023',
            link: 'https://www.sacnas.org/ndistem2023'
        },
        {
            title: '2023 HDR Ecosystem Conference ',
            description: 'The Conference built community, reflected on progress, shared best practices, and addressed shared data-intensive research challenges.',
            startDate: '2023-10-16',
            endDate: '2023-10-18',
            image: '../images/events page images/2023 HDR Ecosystem Conference.jpeg',
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
            image: '../images/events page images/2023 HDR Postbaccalaureate  Workshop.jpg',
            eventType: 'in-person',
            location: 'San Diego, CA',
            institute: 'community',
            customDateText: 'June 20–21, 2023',
            link: 'https://indico.cern.ch/event/1253923/'
        },
        {
            title: '2022 HDR² From Harnessing to Harvesting the Data Revolution',
            description: 'The first HDR Principal Investigator meetings, were the members of the NSF HDR community were assembled.',
            startDate: '2022-10-26',
            endDate: '2022-10-27',
            image: '../images/events page images/2022 HDR² From Harnessing to  Harvesting  the Data Revolution.png',
            eventType: 'in-person',
            location: 'Alexandria, VA',
            institute: 'community',
            customDateText: 'October 26–27, 2022',
            link: 'https://indico.cern.ch/event/1174814/overview'
        }
    ];

    window.populateEvents(sampleEvents);
});
