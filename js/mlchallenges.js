document.addEventListener('DOMContentLoaded', () => {
    setupFilters();
    updateChallengeStatuses();
    setInterval(updateChallengeStatuses, 30000);
});

function setupFilters() {
    const filterToggle = document.getElementById('challengeFilterToggle');
    const filterDropdown = document.getElementById('challengeFilterDropdown');
    const yearFilters = document.querySelectorAll('input[name="challengeYear"]');
    const statusFilters = document.querySelectorAll('input[name="challengeStatus"]');
    const instituteFilters = document.querySelectorAll('input[name="challengeInstitute"]');
    if (!filterToggle || !filterDropdown) return;

    const closeDropdown = () => filterDropdown.classList.add('hidden');

    filterToggle.addEventListener('click', (event) => {
        event.stopPropagation();
        filterDropdown.classList.toggle('hidden');
    });

    document.addEventListener('click', (event) => {
        const clickInside = filterDropdown.contains(event.target) || filterToggle.contains(event.target);
        if (!clickInside) closeDropdown();
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') closeDropdown();
    });

    const filterInputs = [...yearFilters, ...statusFilters, ...instituteFilters];
    filterInputs.forEach((input) => {
        input.addEventListener('change', () => {
            applyFilters();
        });
    });
}

function updateChallengeStatuses() {
    const cards = document.querySelectorAll('.challenge-card[data-deadline]');
    if (!cards.length) return;

    const now = new Date();

    cards.forEach((card) => {
        const deadlineStr = card.dataset.deadline;
        const badge = card.querySelector('[data-status-badge]');
        const countdown = card.querySelector('[data-countdown]');
        const timelineSteps = card.querySelectorAll('.challenge-timeline [data-step]');
        const progressItems = card.querySelectorAll('.progress-bar [data-step-dot]');
        const progressBar = card.querySelector('.progress-bar');

        const openDate = parseDate(card.dataset.open);
        const closeDate = parseDate(deadlineStr);
        const winnersDate = parseDate(card.dataset.winners);
        const workshopDate = parseDate(card.dataset.workshop);

        const msRemaining = closeDate ? (closeDate - now) : null;
        const daysRemaining = msRemaining !== null
            ? Math.max(0, Math.floor(msRemaining / (1000 * 60 * 60 * 24)))
            : null;
        const computedStatus = getComputedStatus(card.dataset.status, openDate, closeDate, now);
        card.dataset.currentStatus = computedStatus;
        const isOpen = computedStatus === 'open';

        // Update badge
        if (badge) {
            const label = computedStatus.charAt(0).toUpperCase() + computedStatus.slice(1);
            badge.textContent = label;
            badge.classList.toggle('status-open', computedStatus === 'open' || computedStatus === 'upcoming');
            badge.classList.toggle('status-closed', computedStatus === 'closed' || computedStatus === 'archived');
        }

        // Update countdown timer
        if (countdown) {
            countdown.classList.toggle('is-closed', !isOpen);
            if (daysRemaining === null) {
                countdown.textContent = 'Timeline unavailable';
            } else if (isOpen) {
                const dayLabel = daysRemaining === 1 ? 'day' : 'days';
                countdown.textContent = `${daysRemaining} ${dayLabel} until submissions close`;
            } else {
                countdown.textContent = 'Submissions closed';
            }
        }

        // Update timeline steps
        if (timelineSteps.length) {
            const dateLookup = {
                open: openDate,
                close: closeDate,
                winners: winnersDate,
                workshop: workshopDate,
            };

            let hasActive = false;
            let activeLabel = null;
            let lastLabel = null;

            timelineSteps.forEach((stepEl, idx) => {
                const stepKey = stepEl.dataset.step;
                const dateForStep = dateLookup[stepKey];
                const isDone = dateForStep ? now > dateForStep : false;
                const isActive = !isDone && !hasActive;
                const stepLabel = (stepEl.querySelector('strong')?.textContent || '').trim();
                lastLabel = stepLabel || lastLabel;

                stepEl.classList.toggle('is-done', isDone);
                stepEl.classList.toggle('is-active', isActive);

                if (progressItems[idx]) {
                    progressItems[idx].classList.toggle('is-complete', isDone);
                    progressItems[idx].classList.toggle('is-active', isActive);
                }

                if (isActive) {
                    hasActive = true;
                    activeLabel = stepLabel || activeLabel;
                }
            });

            if (!hasActive && timelineSteps.length) {
                const lastStep = timelineSteps[timelineSteps.length - 1];
                lastStep.classList.add('is-active');
                const lastItem = progressItems[timelineSteps.length - 1];
                if (lastItem) lastItem.classList.add('is-active');
                activeLabel = lastLabel || activeLabel;
            }

            if (progressBar && progressItems.length) {
                const datedSteps = Array.from(progressItems)
                    .map((item, idx) => {
                        const key = item.dataset.stepDot;
                        const date = dateLookup[key];
                        const position = progressItems.length > 1
                            ? (idx / (progressItems.length - 1)) * 100
                            : 100;
                        return date ? { date, position } : null;
                    })
                    .filter(Boolean);

                const progressPct = calculateProgress(now, datedSteps);
                progressBar.style.setProperty('--progress-fill', `${progressPct}%`);
            }
        }
    });

    applyFilters();
}

function parseDate(dateStr) {
    if (!dateStr) return null;
    const parsed = new Date(`${dateStr}T23:59:59`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getComputedStatus(baseStatus, openDate, closeDate, now) {
    // Explicit overrides
    if (baseStatus === 'archived') return 'archived';
    if (baseStatus === 'closed') return 'closed';
    if (baseStatus === 'upcoming') return 'upcoming';

    // Dynamic based on dates
    if (openDate && now < openDate) return 'upcoming';
    if (closeDate && now > closeDate) return 'closed';
    return 'open';
}

function calculateProgress(now, datedSteps) {
    if (!datedSteps.length) return 0;
    const stepsSorted = datedSteps.sort((a, b) => a.date - b.date);
    const first = stepsSorted[0];
    const last = stepsSorted[stepsSorted.length - 1];

    if (now <= first.date) return 0;
    if (now >= last.date) return 100;

    for (let i = 1; i < stepsSorted.length; i++) {
        const prev = stepsSorted[i - 1];
        const curr = stepsSorted[i];

        if (now <= curr.date) {
            const span = curr.date - prev.date;
            const elapsed = now - prev.date;
            const ratio = span > 0 ? elapsed / span : 0;
            return prev.position + ratio * (curr.position - prev.position);
        }
    }

    return 100;
}

function applyFilters() {
    const cards = document.querySelectorAll('.challenge-card');
    if (!cards.length) return;

    const yearChecks = document.querySelectorAll('input[name="challengeYear"]:checked');
    const instituteChecks = document.querySelectorAll('input[name="challengeInstitute"]:checked');
    const statusSelected = document.querySelector('input[name="challengeStatus"]:checked');

    const yearValues = Array.from(yearChecks).map((el) => el.value);
    const instituteValues = Array.from(instituteChecks).map((el) => el.value);
    const statusValue = statusSelected ? statusSelected.value : 'all';

    cards.forEach((card) => {
        const cardYear = card.dataset.year;
        const cardInstitutes = (card.dataset.institute || '')
            .split(',')
            .map((v) => v.trim())
            .filter(Boolean);
        const cardStatus = card.dataset.currentStatus || card.dataset.status || 'open';

        const yearMatch = yearValues.length ? yearValues.includes(cardYear) : true;
        const instituteMatch = instituteValues.length
            ? cardInstitutes.some((inst) => instituteValues.includes(inst))
            : true;
        const statusMatch = statusValue === 'all' ? true : statusValue === cardStatus;

        const visible = yearMatch && instituteMatch && statusMatch;
        card.style.display = visible ? '' : 'none';
    });
}
