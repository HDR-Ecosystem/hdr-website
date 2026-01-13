const newsData = window.newsData || [];

const NEWS_PER_PAGE = 15; // Desktop default
const MOBILE_NEWS_PER_PAGE = 6; // Mobile-only pagination
let newsPerPage = getNewsPerPage();
const limitedNews = newsData;
let currentPage = 1;

function getNewsPerPage() {
    return window.matchMedia('(max-width: 600px)').matches
        ? MOBILE_NEWS_PER_PAGE
        : NEWS_PER_PAGE;
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
        const card = document.createElement("a");
        card.href = news.link;
        if (isExternal) {
            card.target = "_blank";
            card.rel = "noopener noreferrer";
        }
        card.className = "news-card news-card-linked";
        card.innerHTML = `
            <div class="news-image-wrapper">
                <img src="${news.img}" alt="${news.title}" class="news-image">
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

    const prevBtn = document.createElement("button");
    prevBtn.innerText = "Prev";
    prevBtn.disabled = currentPage === 1;
    prevBtn.addEventListener("click", function() {
        if(currentPage > 1) {
            currentPage--;
            displayNews(currentPage);
        }
    });
    pagination.appendChild(prevBtn);

    for (let i = 1; i <= pageCount; i++) {
        const btn = document.createElement("button");
        btn.innerText = i;
        if(i === currentPage) btn.classList.add("active");
        btn.addEventListener("click", function() {
            currentPage = i;
            displayNews(currentPage);
        });
        pagination.appendChild(btn);
    }

    const nextBtn = document.createElement("button");
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
