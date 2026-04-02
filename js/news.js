const newsData = window.newsData || [];

const NEWS_PER_PAGE = 15; // Desktop default
const MOBILE_NEWS_PER_PAGE = 6; // Mobile-only pagination
const MOBILE_PAGINATION_BREAKPOINT = 600;
let newsPerPage = getNewsPerPage();
const limitedNews = newsData;
let currentPage = 1;

function getNewsPerPage() {
    return window.matchMedia(`(max-width: ${MOBILE_PAGINATION_BREAKPOINT}px)`).matches
        ? MOBILE_NEWS_PER_PAGE
        : NEWS_PER_PAGE;
}

function isMobilePagination() {
    return window.matchMedia(`(max-width: ${MOBILE_PAGINATION_BREAKPOINT}px)`).matches;
}

function getVisiblePaginationItems(totalPages) {
    if (!isMobilePagination() || totalPages <= 7) {
        return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    if (currentPage <= 3) {
        return [1, 2, 3, 'ellipsis', totalPages];
    }

    if (currentPage >= totalPages - 2) {
        return [1, 'ellipsis', totalPages - 2, totalPages - 1, totalPages];
    }

    return [1, 'ellipsis', currentPage - 1, currentPage, currentPage + 1, 'ellipsis', totalPages];
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

function displayNews(page) {
    const container = document.getElementById("news-container");
    container.innerHTML = "";

    const start = (page - 1) * newsPerPage;
    const end = start + newsPerPage;
    const paginatedNews = limitedNews.slice(start, end);

    paginatedNews.forEach(news => {
        const isExternal = isExternalLink(news.link);
        const overlayText = isExternal ? "Read more on external site →" : "Read more →";
        const imageAlt = news.alt || news.title;
        const card = document.createElement("a");
        card.href = news.link;
        if (isExternal) {
            card.target = "_blank";
            card.rel = "noopener noreferrer";
        }
        card.className = "news-card news-card-linked";
        card.innerHTML = `
            <div class="news-image-wrapper">
                <img src="${news.img}" alt="${imageAlt}" class="news-image">
                <div class="news-image-overlay">${overlayText}</div>
                <span class="news-date">${news.date}</span>
            </div>
            <div class="news-content">
                <h2 class="news-title">${news.title}</h2>
                <p class="news-description">${news.description}</p>
            </div>
        `;
        container.appendChild(card);
    });

    setupPagination();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function setupPagination() {
    const pagination = document.getElementById("pagination");
    pagination.innerHTML = "";

    const pageCount = Math.ceil(limitedNews.length / newsPerPage);

    if (pageCount <= 1) return;

    const prevBtn = document.createElement("button");
    prevBtn.className = "pagination-nav";
    prevBtn.innerText = "Prev";
    prevBtn.disabled = currentPage === 1;
    prevBtn.addEventListener("click", function() {
        if(currentPage > 1) {
            currentPage--;
            displayNews(currentPage);
        }
    });
    pagination.appendChild(prevBtn);

    const paginationItems = getVisiblePaginationItems(pageCount);

    paginationItems.forEach((item) => {
        if (item === "ellipsis") {
            const ellipsis = document.createElement("span");
            ellipsis.className = "pagination-ellipsis";
            ellipsis.innerText = "...";
            ellipsis.setAttribute("aria-hidden", "true");
            pagination.appendChild(ellipsis);
            return;
        }

        const btn = document.createElement("button");
        btn.className = "pagination-page";
        btn.innerText = item;
        btn.setAttribute("aria-label", `Go to page ${item}`);
        if(item === currentPage) btn.classList.add("active");
        btn.addEventListener("click", function() {
            currentPage = item;
            displayNews(currentPage);
        });
        pagination.appendChild(btn);
    });

    const nextBtn = document.createElement("button");
    nextBtn.className = "pagination-nav";
    nextBtn.innerText = "Next";
    nextBtn.disabled = currentPage === pageCount;
    nextBtn.addEventListener("click", function() {
        if(currentPage < pageCount) {
            currentPage++;
            displayNews(currentPage);
        }
    });
    pagination.appendChild(nextBtn);
}

displayNews(currentPage);

window.addEventListener('resize', () => {
    const nextPerPage = getNewsPerPage();
    if (nextPerPage !== newsPerPage) {
        newsPerPage = nextPerPage;
        currentPage = 1;
        displayNews(currentPage);
    }
});
