// new entries should be added to the top of the array latest at the top

const newsData = [
    {title: "Imageomics Launches New Catalog for Open Science Resources", date: "December 10, 2025", img: "../images/news page images/imageomicscatalog.png", link: "https://imageomics.osu.edu/news/2025/12/imageomics-launches-new-catalog-showcasing-open-science-resources-ai-and-nature", description: "The Imageomics Catalog is now live, bringing together a collection of public code, datasets, models, and spaces, all in one easy-to-explore hub."},
    {title: "I-GUIDE Ph.D. candidate’s focus on accessible geospatial resources ", date: "December 5, 2025", img: "../images/news page images/NathanIguide.jpg", link: "https://i-guide.io/news_events/user-centered-designs-that-improve-accessibility-for-geospatial-resources-is-hallmark-of-jaroenchais-work/", description: "Nathan’s work centers on designing clear user experiences and developing features that help researchers navigate complex geospatial workflows."},
    {title: "iHARP member, Tolulope Ale defends his PhD Dissertation", date: "November 20, 2025", img: "../images/news page images/iharpalephd.jpg", link: "https://iharp.umbc.edu/news/post/154736/", description: "Tolu's contributions have made him an invaluable member of the iHARP community. His dissertation was about anomaly detection in climate data."},
    {title: "Issue 1: HDR Community Magazine", date: "October 21, 2025", img: "../images/news page images/hdrcommunitymagazine.png", link: "https://www.canva.com/design/DAGnMuxnGdU/E-9X1AGmHzcnSlQstiOzfg/view?utm_content=DAGnMuxnGdU&utm_campaign=designshare&utm_medium=link2&utm_source=uniquelinks&utlId=h5b67d1db3e", description: "Read the HDR Community’s first magazine edition which celebrates our ecosystem. Get up to date on new research, the centers involved, events, and people."},
    {title: "A3D3 team attends Fast Machine Learning for Science conference", date: "September 18, 2025", img: "../images/news page images/a3d3fastmlcarasoul.webp", link: "https://a3d3.ai a3d3-accelerates-real-time-ai-for-scientific-discovery-at-fastml-2025/", description: "A3D3 scientists and engineers presented talks and posters at the conference, including a poster that received a best poster award."},
    {title: "The HDR Ecosystem announce’s second ML Challenge", date: "September 17, 2025", img: "../images/news page images/mlchallengeimagecircles.png", link: "https://www.farr-rcn.org/workshop26", description: "The HDR ML Challenge program is hosting its second FAIR challenge, this year presenting three scientific benchmarks for modeling. Join now!"},
    {title: "I-GUIDE launches Spatial AI Challenge 2025-26", date: "September 15, 2025", img: "../images/news page images/iguidespatialai.png", link: "https://i-guide.io/spatial-ai-challenge-2025-26/", description: "The challenge is about leveraging the  spatial data and AI to solve real-world issues. With a focus on fostering FAIR data and open science practices. "},
    {title: "ID4 co-creates display using AI and structural mechanics research", date: "May 10, 2025", img: "../images/news page images/id4aiexhibit.webp", link: "https://kirigami-strata.ai/", description: "Titled “Kirigami Strata”, the display was featured as part of the European Cultural Centre’s Time Space Existence architecture exhibition in Venice, Italy."},
];

const newsPerPage = 15;
const limitedNews = newsData;
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
                <img src="${news.img}" alt="${news.title}" class="news-image" loading="lazy">
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
