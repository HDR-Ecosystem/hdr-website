

const newsData = [
    {title: "HDR Workshop 2025", date: "Oct 1, 2025", img: "../images/news1.jpeg", link: "https://example.com/1", description: "Highlights from the 2025 HDR workshop."},
    {title: "New AI Research Published", date: "Sep 28, 2025", img: "../images/news2.jpg", link: "https://example.com/2", description: "Our team publishes groundbreaking AI research."},
    {title: "Data Science Seminar", date: "Sep 25, 2025", img: "../images/news3.jpg", link: "https://example.com/3", description: "Upcoming seminar on advanced data science techniques."},
];

const newsPerPage = 3; // limit to three cards for now
const limitedNews = newsData.slice(0, newsPerPage);
let currentPage = 1;

function displayNews(page) {
    const container = document.getElementById("news-container");
    container.innerHTML = "";

    const start = (page - 1) * newsPerPage;
    const end = start + newsPerPage;
    const paginatedNews = limitedNews.slice(start, end);

    paginatedNews.forEach(news => {
        const card = document.createElement("a");
        card.href = news.link;
        card.target = "_blank";
        card.className = "news-card news-card-linked";
        card.innerHTML = `
            <div class="news-image-wrapper">
                <img src="${news.img}" alt="${news.title}" class="news-image">
                <div class="news-image-overlay">Read more on external site →</div>
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
