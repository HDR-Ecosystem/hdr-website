document.addEventListener('DOMContentLoaded', () => {
    const filterToggle = document.getElementById('challengeFilterToggle');
    const filterDropdown = document.getElementById('challengeFilterDropdown');

    if (!filterToggle || !filterDropdown) return;

    filterToggle.addEventListener('click', (event) => {
        event.stopPropagation();
        filterDropdown.classList.toggle('hidden');
    });

    document.addEventListener('click', (event) => {
        const clickInside = filterDropdown.contains(event.target) || filterToggle.contains(event.target);
        if (!clickInside) {
            filterDropdown.classList.add('hidden');
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            filterDropdown.classList.add('hidden');
        }
    });
});
