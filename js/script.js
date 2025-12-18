document.addEventListener('DOMContentLoaded', () => {

    
    const numbersSection = document.querySelector('.numbers-section');
    const numberItems = document.querySelectorAll('.number-value');

    const animateCount = (element) => {
        const targetAttr = element.getAttribute('data-target') || '0';
        const hasPlus = targetAttr.trim().endsWith('+');
        const target = parseInt(targetAttr.replace(/[^0-9]/g, ''), 10) || 0;
        const duration = 2000;
        let startTime = null;

        const animate = (currentTime) => {
            if (startTime === null) startTime = currentTime;
            const elapsedTime = currentTime - startTime;
            const progress = Math.min(elapsedTime / duration, 1);
            const currentValue = Math.floor(progress * target);
            const displayValue = hasPlus ? `${currentValue}+` : `${currentValue}`;
            element.textContent = displayValue;

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                element.textContent = hasPlus ? `${target}+` : `${target}`;
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

    window.initHamburger = function initHamburger() {
        const hamburger = document.getElementById('hamburger');
        const navMenu = document.querySelector('.nav');
        
        if (!hamburger || !navMenu || hamburger.dataset.bound === 'true') {
            return;
        }

        hamburger.dataset.bound = 'true';

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
    };

    window.initHamburger();

    const pagesToIndex = [
        { title: "Home", url: "index.html", keywords: "HDR community home institutes events news resources publications challenges" },
        { title: "About", url: "html/about.html", keywords: "About HDR mission institutes data revolution overview" },
        { title: "Resources", url: "html/resources.html", keywords: "data education code models datasets training materials" },
        { title: "News", url: "html/news.html", keywords: "news articles updates press releases" },
        { title: "Publications", url: "html/publications.html", keywords: "publications papers research articles" },
        { title: "Challenges", url: "html/mlchallenges.html", keywords: "machine learning challenges competitions leaderboard datasets" },
        { title: "Events", url: "html/events.html", keywords: "events workshops conferences hackathons webinars" },
        { title: "A3D3", url: "html/institutes/a3d3.html", keywords: "A3D3 accelerated AI algorithms data driven discovery" },
        { title: "ID4", url: "html/institutes/id4.html", keywords: "ID4 institute for data driven dynamical design materials science" },
        { title: "I-GUIDE", url: "html/institutes/iguide.html", keywords: "I-GUIDE geospatial data integrative discovery environment" },
        { title: "iHARP", url: "html/institutes/iharp.html", keywords: "iHARP polar science climate modeling data revolution" },
        { title: "Imageomics", url: "html/institutes/imageomics.html", keywords: "Imageomics AI biodiversity biology computer vision" },
        { title: "ML Challenge Year 1", url: "html/mlchallenge-y1/index.html", keywords: "machine learning challenge year 1 rules datasets leaderboard" },
        { title: "ML Challenge Year 2", url: "html/mlchallenge-y2/index.html", keywords: "machine learning challenge year 2 rules datasets leaderboard" },
        { title: "AAAI Workshop 2024", url: "html/mlchallenge-y1/aaai-workshop2024.html", keywords: "AAAI workshop 2024 HDR machine learning" }
    ];

    const currentHref = window.location.href;
    const siteBaseHref = (() => {
        if (currentHref.includes('/html/')) {
            return currentHref.split('/html/')[0] + '/';
        }
        if (currentHref.endsWith('/')) {
            return currentHref;
        }
        return currentHref.replace(/[^/]*$/, '');
    })();

    const resolveToAbsolute = (relativePath) => new URL(relativePath, siteBaseHref).href;

    let searchIndexData = [];
    let isIndexBuilt = false;
    let buildIndexPromise = null;
    let pendingQuery = '';
    const searchResultsPageContainer = document.getElementById('searchResultsPage');
    const searchQueryText = document.getElementById('searchQueryText');
    const initialPageQuery = new URLSearchParams(window.location.search).get('q') || '';

    function extractTextFromHtml(html) {
        const temp = document.createElement('div');
        temp.innerHTML = html;
        
        const scripts = temp.querySelectorAll('script, style');
        scripts.forEach(script => script.remove());

        const chrome = temp.querySelectorAll('header, nav, footer, .header, .nav, .footer');
        chrome.forEach(el => el.remove());
        
        let text = temp.textContent || temp.innerText || '';
        text = text.replace(/\s+/g, ' ').trim();
        
        return text;
    }

    async function buildSearchIndex() {
        console.log('Building search index...');
        
        for (const page of pagesToIndex) {
            const resolvedUrl = resolveToAbsolute(page.url);
            try {
                const response = await fetch(resolvedUrl);
                if (response.ok) {
                    const html = await response.text();
                    const textContent = extractTextFromHtml(html);
                    
                    searchIndexData.push({
                        title: page.title,
                        url: resolvedUrl,
                        content: `${page.keywords || ''} ${textContent}`.trim(),
                        contentLower: `${page.keywords || ''} ${textContent}`.toLowerCase().trim()
                    });
                    
                    console.log(`Indexed: ${page.title}`);
                } else {
                    searchIndexData.push({
                        title: page.title,
                        url: resolvedUrl,
                        content: page.keywords || page.title,
                        contentLower: (page.keywords || page.title).toLowerCase()
                    });
                    console.log(`Fallback indexed (response ${response.status}): ${page.title}`);
                }
            } catch (error) {
                console.log(`Could not index ${page.title}:`, error);
                searchIndexData.push({
                    title: page.title,
                    url: resolvedUrl,
                    content: page.keywords || page.title,
                    contentLower: (page.keywords || page.title).toLowerCase()
                });
            }
        }
        
        isIndexBuilt = true;
        console.log('Search index complete. Pages indexed:', searchIndexData.length);

        if (pendingQuery && pendingQuery.length >= 2 && searchBar) {
            const results = performFullTextSearch(pendingQuery);
            displayResults(results, pendingQuery);
        }

        if (searchResultsPageContainer) {
            const seedQuery = (searchBar && searchBar.value) || initialPageQuery || pendingQuery;
            if (seedQuery) {
                runPageSearch(seedQuery);
            } else {
                showPageMessage('Type a search term and press Enter.');
            }
        }
    }

    function ensureSearchIndex() {
        if (!buildIndexPromise) {
            buildIndexPromise = buildSearchIndex().catch((error) => {
                console.error('Failed to build search index', error);
                isIndexBuilt = true;
            });
        }
        return buildIndexPromise;
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

    const searchBar = document.getElementById('searchBar');
    const searchContainer = document.getElementById('searchContainer');
    const searchIconBtn = document.querySelector('.search-icon-btn');
    const resultsContainer = document.getElementById('searchResults');
    const searchPagePath = 'html/search.html';

    function showPageMessage(message) {
        if (searchResultsPageContainer) {
            searchResultsPageContainer.innerHTML = '<div class="search-results-page-message">' + message + '</div>';
        }
    }

    function setPageQueryText(query) {
        if (searchQueryText) {
            searchQueryText.textContent = query || '';
        }
    }

    function renderPageResults(results, query) {
        if (!searchResultsPageContainer) {
            return;
        }

        setPageQueryText(query);

        if (!query) {
            showPageMessage('Type a search term and press Enter.');
            return;
        }

        if (!isIndexBuilt) {
            showPageMessage('Building search index...');
            return;
        }

        if (results.length === 0) {
            showPageMessage('No results found for "' + query + '".');
            return;
        }

        let html = '<div class="search-results-page-list">';
        
        results.forEach(result => {
            const highlightedSnippet = result.snippet.replace(
                new RegExp(query, 'gi'),
                '<strong>$&</strong>'
            );
            
            html += `
                <a href="${result.url}" class="search-result-item search-result-item-page">
                    <div class="search-result-title">${result.title}</div>
                    <div class="search-result-snippet">${highlightedSnippet}</div>
                </a>
            `;
        });
        
        html += '</div>';
        searchResultsPageContainer.innerHTML = html;
    }

    async function runPageSearch(query) {
        if (!searchResultsPageContainer) {
            return;
        }

        const trimmedQuery = (query || '').trim();
        pendingQuery = trimmedQuery;
        setPageQueryText(trimmedQuery);

        if (!trimmedQuery) {
            showPageMessage('Type a search term and press Enter.');
            return;
        }

        showPageMessage(isIndexBuilt ? 'Searching...' : 'Building search index...');
        await ensureSearchIndex();

        const results = performFullTextSearch(trimmedQuery);
        renderPageResults(results, trimmedQuery);

        if (window.location.pathname.endsWith('/html/search.html') || window.location.pathname.endsWith('search.html')) {
            const newQuery = '?q=' + encodeURIComponent(trimmedQuery);
            window.history.replaceState({}, '', newQuery);
        }
    }

    function displayResults(results, query) {
        if (!resultsContainer) {
            return;
        }

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

    if (searchBar && searchContainer && resultsContainer) {
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

        searchBar.addEventListener('focus', () => {
            ensureSearchIndex();
        });

        searchBar.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            pendingQuery = query;
            
            if (query.length < 2) {
                resultsContainer.innerHTML = '';
                resultsContainer.style.display = 'none';
                return;
            }

            resultsContainer.innerHTML = '<div class="search-no-results">Building search index...</div>';
            resultsContainer.style.display = 'block';

            ensureSearchIndex().then(() => {
                if (pendingQuery !== query) return;
                const results = performFullTextSearch(query);
                displayResults(results, query);
            });
        });

        searchBar.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const query = searchBar.value.trim();
                pendingQuery = query;

                if (query.length < 2) {
                    resultsContainer.innerHTML = '<div class="search-no-results">Type at least 2 characters to search.</div>';
                    resultsContainer.style.display = 'block';
                    return;
                }

                if (searchResultsPageContainer) {
                    runPageSearch(query);
                    return;
                }

                const targetUrl = resolveToAbsolute(searchPagePath + '?q=' + encodeURIComponent(query));
                window.location.href = targetUrl;
            }
        });

        if (initialPageQuery && searchBar.value.trim() === '') {
            searchBar.value = initialPageQuery;
        }
    }

    if (searchResultsPageContainer) {
        if (initialPageQuery) {
            if (searchBar && searchBar.value.trim() === '') {
                searchBar.value = initialPageQuery;
            }
            runPageSearch(initialPageQuery);
        } else {
            showPageMessage('Type a search term and press Enter.');
        }
    }
});
