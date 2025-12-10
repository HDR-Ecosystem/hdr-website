

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
    
    const event = new Date(eventDate);
    event.setHours(0, 0, 0, 0);
    
    return event >= today ? 'upcoming' : 'past';
}

function formatEventDateTime(dateString, timeString = '12:00pm', timezone = 'CT') {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const formattedDate = date.toLocaleDateString('en-US', options);
    return `${formattedDate} ${timeString} (${timezone})`;
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
    allEvents = eventsData.map(event => ({
        ...event,
        type: classifyEvent(event.date),
        dateTime: formatEventDateTime(event.date, event.time, event.timezone),
        searchable: `${event.title} ${event.description} ${event.institute || ''}`.toLowerCase()
    }));

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
            title: 'I-GUIDE VCO: Visualization and Story Telling',
            description: 'Webinar talk on data visualization approaches with emphasis on storytelling and broader context.',
            date: '2025-08-15',
            time: '2:00pm',
            timezone: 'CT',
            image: 'https://via.placeholder.com/400x300?text=A3D3+Symposium',
            eventType: 'virtual',
            location: 'Online',
            institute: 'I-GUIDE',
            link: '#'
        },
        {
            title: 'A3D3 Annual Symposium',
            description: 'Join us for our annual symposium featuring keynote speakers and research presentations from across the institute.',
            date: '2025-09-20',
            time: '10:00am',
            timezone: 'ET',
            image: 'https://via.placeholder.com/400x300?text=A3D3+Symposium',
            eventType: 'in-person',
            location: 'Columbus, OH',
            institute: 'A3D3',
            link: '#'
        },
        {
            title: 'HDR Community Meetup',
            description: 'Networking event for HDR institute members and researchers to share ideas and collaborate.',
            date: '2025-10-10',
            time: '1:00pm',
            timezone: 'CT',
            image: 'https://via.placeholder.com/400x300?text=HDR+Community',
            eventType: 'in-person',
            location: 'Chicago, IL',
            institute: 'Community',
            link: '#'
        },
        {
            title: 'Imageomics Workshop Series',
            description: 'Hands-on workshop covering advanced image analysis techniques and machine learning applications.',
            date: '2025-11-05',
            time: '3:00pm',
            timezone: 'CT',
            image: 'https://via.placeholder.com/400x300?text=Imageomics',
            eventType: 'hybrid',
            location: 'Austin, TX',
            institute: 'Imageomics',
            link: '#'
        },
        {
            title: 'iHARP Data Harmonization Webinar',
            description: 'Learn about best practices for data harmonization across diverse sources and institutes.',
            date: '2025-12-01',
            time: '11:00am',
            timezone: 'ET',
            image: 'https://via.placeholder.com/400x300?text=iHARP',
            eventType: 'virtual',
            location: 'Online',
            institute: 'iHARP',
            link: '#'
        },
        {
            title: 'ID4 Summit 2025',
            description: 'Annual summit bringing together experts to discuss the latest in inclusive data science.',
            date: '2025-09-15',
            time: '9:00am',
            timezone: 'PT',
            image: 'https://via.placeholder.com/400x300?text=ID4+Summit',
            eventType: 'in-person',
            location: 'Seattle, WA',
            institute: 'ID4',
            link: '#'
        },
        {
            title: 'Machine Learning Fundamentals Workshop',
            description: 'Comprehensive training on ML fundamentals with practical applications in data science.',
            date: '2024-12-10',
            time: '2:00pm',
            timezone: 'CT',
            image: 'https://via.placeholder.com/400x300?text=ML+Workshop',
            eventType: 'in-person',
            location: 'Denver, CO',
            institute: 'A3D3',
            link: '#'
        },
        {
            title: 'Data Visualization Best Practices',
            description: 'Learn how to create compelling visualizations that tell your data story effectively.',
            date: '2024-11-20',
            time: '1:00pm',
            timezone: 'CT',
            image: 'https://via.placeholder.com/400x300?text=Visualization',
            eventType: 'virtual',
            location: 'Online',
            institute: 'I-GUIDE',
            link: '#'
        },
        {
            title: 'HDR Research Symposium',
            description: 'Showcase of cutting-edge research from all five HDR institutes with networking opportunities.',
            date: '2024-10-15',
            time: '8:30am',
            timezone: 'CT',
            image: 'https://via.placeholder.com/400x300?text=HDR+Research',
            eventType: 'in-person',
            location: 'Washington, DC',
            institute: 'Community',
            link: '#'
        },
        {
            title: 'Advanced Data Science Certification',
            description: 'Professional certification program covering advanced topics in data science and analytics.',
            date: '2025-01-15',
            time: '9:00am',
            timezone: 'CT',
            image: 'https://via.placeholder.com/400x300?text=Certification',
            eventType: 'virtual',
            location: 'Online',
            institute: 'A3D3',
            link: '#'
        },
        {
            title: 'Big Data Processing Bootcamp',
            description: 'Intensive bootcamp on processing large-scale datasets using modern distributed computing frameworks.',
            date: '2025-02-01',
            time: '10:00am',
            timezone: 'CT',
            image: 'https://via.placeholder.com/400x300?text=Big+Data',
            eventType: 'in-person',
            location: 'San Francisco, CA',
            institute: 'Imageomics',
            link: '#'
        },
        {
            title: 'Research Ethics in Data Science',
            description: 'Discussion on ethical considerations and best practices when working with sensitive research data.',
            date: '2025-03-10',
            time: '2:00pm',
            timezone: 'ET',
            image: 'https://via.placeholder.com/400x300?text=Ethics',
            eventType: 'virtual',
            location: 'Online',
            institute: 'ID4',
            link: '#'
        },
        {
            title: 'Cloud Computing for Research',
            description: 'Learn to leverage cloud platforms for scalable research computing and data analysis.',
            date: '2025-04-05',
            time: '1:00pm',
            timezone: 'PT',
            image: 'https://via.placeholder.com/400x300?text=Cloud',
            eventType: 'hybrid',
            location: 'Portland, OR',
            institute: 'iHARP',
            link: '#'
        },
        {
            title: 'AI and Machine Learning Summit',
            description: 'Conference featuring industry leaders discussing the future of AI and machine learning applications.',
            date: '2025-05-20',
            time: '8:00am',
            timezone: 'CT',
            image: 'https://via.placeholder.com/400x300?text=AI+Summit',
            eventType: 'in-person',
            location: 'Boston, MA',
            institute: 'Community',
            link: '#'
        },
        {
            title: 'Statistical Methods for Modern Data',
            description: 'Advanced statistical techniques tailored for high-dimensional and complex modern datasets.',
            date: '2024-09-01',
            time: '3:00pm',
            timezone: 'CT',
            image: 'https://via.placeholder.com/400x300?text=Statistics',
            eventType: 'virtual',
            location: 'Online',
            institute: 'A3D3',
            link: '#'
        },
        {
            title: 'Network Analysis Workshop',
            description: 'Hands-on workshop exploring graph theory and network analysis techniques for complex systems.',
            date: '2024-08-15',
            time: '2:00pm',
            timezone: 'CT',
            image: 'https://via.placeholder.com/400x300?text=Networks',
            eventType: 'in-person',
            location: 'Miami, FL',
            institute: 'I-GUIDE',
            link: '#'
        }
    ];

    window.populateEvents(sampleEvents);
});
