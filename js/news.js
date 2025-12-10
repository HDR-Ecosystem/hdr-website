

const newsData = [
    {title: "HDR Workshop 2025", date: "Oct 1, 2025", img: "../images/news1.jpeg", link: "https://example.com/1", description: "Highlights from the 2025 HDR workshop."},
    {title: "New AI Research Published", date: "Sep 28, 2025", img: "../images/news2.jpg", link: "https://example.com/2", description: "Our team publishes groundbreaking AI research."},
    {title: "Data Science Seminar", date: "Sep 25, 2025", img: "../images/news3.jpg", link: "https://example.com/3", description: "Upcoming seminar on advanced data science techniques."},
    {title: "I-GUIDE Collaboration", date: "Sep 22, 2025", img: "../images/news4.jpg", link: "https://example.com/4", description: "I-GUIDE announces a new collaboration project."},
    {title: "iHARP Update", date: "Sep 20, 2025", img: "../images/news5.jpg", link: "https://example.com/5", description: "Latest progress report from the iHARP institute."},
    {title: "Imageomics Breakthrough", date: "Sep 18, 2025", img: "../images/news6.jpg", link: "https://example.com/6", description: "New findings published in imageomics research."},
    {title: "NSF Grant Awarded", date: "Sep 15, 2025", img: "../images/news7.jpg", link: "https://example.com/7", description: "NSF awards new grant for HDR research."},
    {title: "Community Spotlight", date: "Sep 12, 2025", img: "../images/news8.jpg", link: "https://example.com/8", description: "Highlighting community achievements this month."},
    {title: "AI Ethics Panel", date: "Sep 10, 2025", img: "../images/news9.jpg", link: "https://example.com/9", description: "Panel discussion on AI ethics in research."},
    {title: "HDR Newsletter October", date: "Sep 8, 2025", img: "../images/news10.jpg", link: "https://example.com/10", description: "October edition of the HDR newsletter is out."},
    {title: "Research Showcase", date: "Sep 5, 2025", img: "../images/news11.jpg", link: "https://example.com/11", description: "Showcase of recent breakthroughs from institutes."},
    {title: "Student Internship Program", date: "Sep 3, 2025", img: "../images/news12.jpg", link: "https://example.com/12", description: "Applications now open for HDR student internships."},
    {title: "Data Management Workshop", date: "Sep 1, 2025", img: "../images/news13.jpg", link: "https://example.com/13", description: "Workshop on best practices for data management."},
    {title: "HDR Research Awards", date: "Aug 28, 2025", img: "../images/news14.jpg", link: "https://example.com/14", description: "Announcing recipients of HDR research awards."},
    {title: "AI in Healthcare", date: "Aug 25, 2025", img: "../images/news15.jpg", link: "https://example.com/15", description: "How AI is transforming healthcare research."},
    {title: "New Machine Learning Tool", date: "Aug 22, 2025", img: "../images/news16.jpg", link: "https://example.com/16", description: "Introducing a new ML tool for HDR projects."},
    {title: "Collaborative Data Project", date: "Aug 20, 2025", img: "../images/news17.jpg", link: "https://example.com/17", description: "A multi-institute data project launches this fall."},
    {title: "HDR Conference 2025", date: "Aug 18, 2025", img: "../images/news18.jpg", link: "https://example.com/18", description: "Conference schedule announced for HDR 2025."},
    {title: "Open Data Initiative", date: "Aug 15, 2025", img: "../images/news19.jpg", link: "https://example.com/19", description: "New open data initiative supporting research."},
    {title: "NSF HDR Milestones", date: "Aug 12, 2025", img: "../images/news20.jpg", link: "https://example.com/20", description: "Celebrating key milestones in the HDR program."}
];

const newsPerPage = 15;
let currentPage = 1;

function displayNews(page) {
    const container = document.getElementById("news-container");
    container.innerHTML = "";

    const start = (page - 1) * newsPerPage;
    const end = start + newsPerPage;
    const paginatedNews = newsData.slice(start, end);

    paginatedNews.forEach(news => {
        const card = document.createElement("a");
        card.href = news.link;
        card.target = "_blank";
        card.className = "news-card";
        card.innerHTML = `
            <div class="news-image-wrapper">
                <img src="${news.img}" alt="${news.title}" class="news-image">
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

    const pageCount = Math.ceil(newsData.length / newsPerPage);

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
