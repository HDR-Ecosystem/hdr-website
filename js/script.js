document.addEventListener('DOMContentLoaded', () => {
    // ===================================== 
    // Number Animation
    // =====================================
    
    const numbersSection = document.querySelector('.numbers-section');
    const numberItems = document.querySelectorAll('.number-value');

    const animateCount = (element) => {
        const target = +element.getAttribute('data-target');
        const duration = 2000;
        let startTime = null;

        const animate = (currentTime) => {
            if (startTime === null) startTime = currentTime;
            const elapsedTime = currentTime - startTime;
            const progress = Math.min(elapsedTime / duration, 1);
            const currentValue = Math.floor(progress * target);
            element.textContent = currentValue;

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    };

    const observerCallback = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                numberItems.forEach(item => {
                    animateCount(item);
                });
                observer.disconnect();
            }
        });
    };

    const observer = new IntersectionObserver(observerCallback, {
        root: null,
        rootMargin: '0px',
        threshold: 0.5
    });

    if (numbersSection) {
        observer.observe(numbersSection);
    }

    // ===================================== 
    // Hamburger Menu Toggle
    // =====================================

    const hamburger = document.getElementById('hamburger');
    const navMenu = document.querySelector('.nav');
    
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', function() {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
            document.body.classList.toggle('menu-open');
        });
        
        document.addEventListener('click', function(e) {
            if (navMenu.classList.contains('active') && 
                !navMenu.contains(e.target) && 
                !hamburger.contains(e.target)) {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
                document.body.classList.remove('menu-open');
            }
        });
        
        const links = navMenu.querySelectorAll('a');
        links.forEach(link => {
            link.addEventListener('click', function() {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
                document.body.classList.remove('menu-open');
            });
        });
        
        const dropdowns = navMenu.querySelectorAll('.dropdown');
        dropdowns.forEach(dropdown => {
            const link = dropdown.querySelector('a');
            link.addEventListener('click', function(e) {
                if (window.innerWidth <= 768) {
                    e.preventDefault();
                    const menu = dropdown.querySelector('.dropdown-menu');
                    menu.classList.toggle('show');
                }
            });
        });
    }

    // ===================================== 
    // Search Index Building
    // =====================================

    const pagesToIndex = [
        { title: "About", url: "html/about.html" },
        { title: "Resources", url: "html/resources.html" },
        { title: "News", url: "html/news.html" },
        { title: "Publications", url: "html/publications.html" },
        { title: "Challenges", url: "html/mlchallenges.html" },
        { title: "Events", url: "html/events.html" },
        { title: "A3D3", url: "html/institutes/a3d3.html" },
        { title: "ID4", url: "html/institutes/id4.html" },
        { title: "I-GUIDE", url: "html/institutes/iguide.html" },
        { title: "iHARP", url: "html/institutes/iharp.html" },
        { title: "Imageomics", url: "html/institutes/imageomics.html" }
    ];

    let searchIndexData = [];

    function extractTextFromHtml(html) {
        const temp = document.createElement('div');
        temp.innerHTML = html;
        
        const scripts = temp.querySelectorAll('script, style');
        scripts.forEach(script => script.remove());
        
        let text = temp.textContent || temp.innerText || '';
        text = text.replace(/\s+/g, ' ').trim();
        
        return text;
    }

    async function buildSearchIndex() {
        console.log('Building search index...');
        
        for (const page of pagesToIndex) {
            try {
                const response = await fetch(page.url);
                if (response.ok) {
                    const html = await response.text();
                    const textContent = extractTextFromHtml(html);
                    
                    searchIndexData.push({
                        title: page.title,
                        url: page.url,
                        content: textContent,
                        contentLower: textContent.toLowerCase()
                    });
                    
                    console.log(`Indexed: ${page.title}`);
                }
            } catch (error) {
                console.log(`Could not index ${page.title}:`, error);
            }
        }
        
        console.log('Search index complete. Pages indexed:', searchIndexData.length);
    }

    function performFullTextSearch(query) {
        if (!query || query.length < 2) {
            return [];
        }
        
        const queryLower = query.toLowerCase();
        const results = [];
        
        searchIndexData.forEach(page => {
            const titleMatch = page.title.toLowerCase().includes(queryLower);
            const contentMatch = page.contentLower.includes(queryLower);
            
            if (titleMatch || contentMatch) {
                let snippet = '';
                if (contentMatch) {
                    const index = page.contentLower.indexOf(queryLower);
                    const start = Math.max(0, index - 50);
                    const end = Math.min(page.contentLower.length, index + 100);
                    snippet = page.content.substring(start, end);
                    if (start > 0) snippet = '...' + snippet;
                    if (end < page.content.length) snippet = snippet + '...';
                }
                
                results.push({
                    title: page.title,
                    url: page.url,
                    snippet: snippet || page.content.substring(0, 150),
                    isExact: titleMatch
                });
            }
        });
        
        return results;
    }

    // ===================================== 
    // Search Bar Functionality
    // =====================================

    const searchBar = document.getElementById('searchBar');
    const searchContainer = document.getElementById('searchContainer');
    const searchIconBtn = document.querySelector('.search-icon-btn');
    const resultsContainer = document.getElementById('searchResults');

    if (searchIconBtn) {
        searchIconBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            
            if (window.innerWidth <= 768) {
                searchContainer.classList.toggle('mobile-active');
                if (searchContainer.classList.contains('mobile-active')) {
                    searchBar.focus();
                }
            }
        });
    }

    document.addEventListener('click', (e) => {
        if (!searchBar.contains(e.target) && !resultsContainer.contains(e.target) && e.target !== searchIconBtn) {
            resultsContainer.innerHTML = '';
            resultsContainer.style.display = 'none';
            if (window.innerWidth <= 768) {
                searchContainer.classList.remove('mobile-active');
            }
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            resultsContainer.innerHTML = '';
            resultsContainer.style.display = 'none';
            if (window.innerWidth <= 768) {
                searchContainer.classList.remove('mobile-active');
            }
        }
    });

    searchBar.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        
        if (query.length < 2) {
            resultsContainer.innerHTML = '';
            resultsContainer.style.display = 'none';
            return;
        }
        
        const results = performFullTextSearch(query);
        displayResults(results, query);
    });

    function displayResults(results, query) {
        if (results.length === 0) {
            resultsContainer.innerHTML = '<div class="search-no-results">No results found for "' + query + '"</div>';
            resultsContainer.style.display = 'block';
            return;
        }
        
        let html = '<div class="search-results-list">';
        
        results.forEach(result => {
            const highlightedSnippet = result.snippet.replace(
                new RegExp(query, 'gi'),
                '<strong>$&</strong>'
            );
            
            html += `
                <a href="${result.url}" class="search-result-item">
                    <div class="search-result-title">${result.title}</div>
                    <div class="search-result-snippet">${highlightedSnippet}</div>
                </a>
            `;
        });
        
        html += '</div>';
        resultsContainer.innerHTML = html;
        resultsContainer.style.display = 'block';
    }

    // Build the search index on page load
    buildSearchIndex();
});