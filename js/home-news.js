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

function parseNewsDate(dateString) {
    const parsed = new Date(dateString);
    return Number.isNaN(parsed.getTime()) ? new Date(0) : parsed;
}

function renderHomeNews() {
    const container = document.getElementById('home-news-container');
    if (!container || !Array.isArray(window.newsData)) return;

    const sortedNews = [...window.newsData].sort((a, b) => {
        return parseNewsDate(b.date) - parseNewsDate(a.date);
    });

    const topNews = sortedNews.slice(0, 2);
    container.innerHTML = '';

    topNews.forEach(news => {
        const isExternal = isExternalLink(news.link);
        const overlayText = isExternal ? 'Read more on external site →' : 'Read more →';
        const imageAlt = news.alt || news.title;
        const card = document.createElement('a');
        const linkHref = news.link && news.link.startsWith('../')
            ? news.link.replace('../', '')
            : news.link;
        const imageSrc = news.img && news.img.startsWith('../')
            ? news.img.replace('../', '')
            : news.img;
        card.href = linkHref;
        if (isExternal) {
            card.target = '_blank';
            card.rel = 'noopener noreferrer';
        }
        card.className = 'news-card news-card-linked';
        card.innerHTML = `
            <div class="news-image-wrapper">
                <img src="${imageSrc}" alt="${imageAlt}" class="news-image">
                <div class="news-image-overlay">${overlayText}</div>
                <div class="news-date">${news.date}</div>
            </div>
            <div class="news-content">
                <h3 class="news-title">${news.title}</h3>
                <p class="news-description">${news.description}</p>
            </div>
        `;
        container.appendChild(card);
    });
}

document.addEventListener('DOMContentLoaded', renderHomeNews);
