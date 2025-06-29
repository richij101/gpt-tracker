document.addEventListener('DOMContentLoaded', () => {
    console.log('SED Tracker App Initialized');

    // --- Elements ---
    const navLinks = document.querySelectorAll('.sidebar nav ul li a');
    const sections = document.querySelectorAll('.main-content section');
    const calendarView = document.getElementById('calendar-view');
    const dashboardView = document.getElementById('dashboard-view');
    const monthYearElement = document.getElementById('month-year');
    const calendarGrid = document.querySelector('.calendar-grid');
    const prevMonthButton = document.getElementById('prev-month');
    const nextMonthButton = document.getElementById('next-month');
    const entryModal = document.getElementById('entry-modal');
    const closeModalButton = document.getElementById('close-modal-button');
    const entryForm = document.getElementById('entry-form');
    const entryDateElement = document.getElementById('entry-date');
    const entryCategoryElement = document.getElementById('entry-category');
    const workShipFields = document.getElementById('work-ship-fields');
    const workLandFields = document.getElementById('work-land-fields');
    const modalTitleElement = document.getElementById('modal-title');
    const deleteEntryButton = document.getElementById('delete-entry-button');

    // Filter Elements
    const filterForm = document.getElementById('filter-form');
    const filterDateStartElement = document.getElementById('filter-date-start');
    const filterDateEndElement = document.getElementById('filter-date-end');
    const filterCategoryElement = document.getElementById('filter-category');
    const filterKeywordElement = document.getElementById('filter-keyword');
    const applyFiltersButton = document.getElementById('apply-filters');
    const resetFiltersButton = document.getElementById('reset-filters');

    // --- State ---
    let currentDate = new Date();
    let entries = [];
    let editingEntryId = null;
    let currentFilters = {
        dateStart: '',
        dateEnd: '',
        category: '',
        keyword: ''
    };

    // --- Utility Functions ---
    function getFilteredEntries() {
        return entries.filter(entry => {
            const entryDate = new Date(entry.date);
            const startDate = currentFilters.dateStart ? new Date(currentFilters.dateStart) : null;
            const endDate = currentFilters.dateEnd ? new Date(currentFilters.dateEnd) : null;

            if (startDate && entryDate < startDate) return false;
            if (endDate && entryDate > endDate) return false;
            if (currentFilters.category && entry.category !== currentFilters.category) return false;
            if (currentFilters.keyword) {
                const keyword = currentFilters.keyword.toLowerCase();
                const shipName = (entry.shipName || '').toLowerCase();
                const country = (entry.country || '').toLowerCase();
                const notes = (entry.notes || '').toLowerCase();
                if (!shipName.includes(keyword) && !country.includes(keyword) && !notes.includes(keyword)) {
                    return false;
                }
            }
            return true;
        });
    }

    // --- Navigation ---
    navLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            const targetId = link.id.replace('nav-', '') + '-view';
            sections.forEach(section => {
                const isTarget = section.id === targetId;
                section.style.display = isTarget ? 'block' : 'none';
                if (isTarget && section.id === 'dashboard-view') {
                    updateDashboard();
                }
            });
        });
    });

    document.getElementById('add-entry-view').style.display = 'none';
    document.getElementById('reports-view').style.display = 'none';
    document.getElementById('compliance-view').style.display = 'none';
    if (calendarView) calendarView.style.display = 'block';
    if (dashboardView) dashboardView.style.display = 'none';

    // --- Calendar Rendering ---
    function renderCalendar() {
        if (!calendarGrid || !monthYearElement) return;
        calendarGrid.innerHTML = '';
        const month = currentDate.getMonth();
        const year = currentDate.getFullYear();
        monthYearElement.textContent = `${currentDate.toLocaleString('default', { month: 'long' })} ${year}`;
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        dayNames.forEach(name => { /* ... add day names ... */
            const dayNameCell = document.createElement('div');
            dayNameCell.classList.add('day-name');
            dayNameCell.textContent = name;
            calendarGrid.appendChild(dayNameCell);
        });
        for (let i = 0; i < firstDayOfMonth; i++) { /* ... add empty cells ... */
            const emptyCell = document.createElement('div');
            emptyCell.classList.add('empty-day');
            calendarGrid.appendChild(emptyCell);
        }

        const visibleEntries = getFilteredEntries(); // Use filtered entries for display

        for (let day = 1; day <= daysInMonth; day++) {
            const dateCell = document.createElement('div');
            const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            dateCell.dataset.date = dateString;
            const dayNumber = document.createElement('span');
            dayNumber.textContent = day;
            dateCell.appendChild(dayNumber);
            if (day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear()) {
                dateCell.classList.add('current-day');
            }

            const dayEntries = visibleEntries.filter(entry => entry.date === dateString);
            dayEntries.forEach(entry => {
                const entryDiv = document.createElement('div');
                entryDiv.classList.add('calendar-entry', `entry-${entry.category.toLowerCase()}`, `entry-status-${entry.status.toLowerCase()}`);
                let entryText = entry.category.replace('_', ' ');
                if (entry.category === 'work_ship' && entry.shipName) entryText += `: ${entry.shipName}`;
                else if (entry.category === 'work_land' && entry.country) entryText += `: ${entry.country}`;
                entryDiv.textContent = entryText;
                entryDiv.title = `${entryText} (${entry.status})`;
                entryDiv.addEventListener('click', (event) => {
                    event.stopPropagation();
                    openModal(entry.date, entry);
                });
                dateCell.appendChild(entryDiv);
            });
            calendarGrid.appendChild(dateCell);
        }
    }
    if (prevMonthButton) prevMonthButton.addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() - 1); renderCalendar(); });
    if (nextMonthButton) nextMonthButton.addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() + 1); renderCalendar(); });

    // --- Modal Logic ---
    function openModal(dateString, entryToEdit = null) {
        entryForm.reset();
        entryDateElement.value = dateString;
        if (entryToEdit) {
            editingEntryId = entryToEdit.id;
            modalTitleElement.textContent = `Edit Entry for ${dateString}`;
            document.getElementById('entry-category').value = entryToEdit.category;
            if (entryToEdit.category === 'work_ship') document.getElementById('ship-name').value = entryToEdit.shipName || '';
            else if (entryToEdit.category === 'work_land') document.getElementById('country').value = entryToEdit.country || '';
            document.getElementById('entry-status').value = entryToEdit.status;
            document.getElementById('entry-notes').value = entryToEdit.notes || '';
            deleteEntryButton.style.display = 'inline-block';
        } else {
            editingEntryId = null;
            modalTitleElement.textContent = `Add Entry for ${dateString}`;
            deleteEntryButton.style.display = 'none';
        }
        handleCategoryChange();
        entryModal.style.display = 'block';
    }
    function closeModal() { entryModal.style.display = 'none'; editingEntryId = null; }
    function handleCategoryChange() {
        const selectedCategory = entryCategoryElement.value;
        workShipFields.style.display = selectedCategory === 'work_ship' ? 'block' : 'none';
        workLandFields.style.display = selectedCategory === 'work_land' ? 'block' : 'none';
    }
    if (closeModalButton) closeModalButton.addEventListener('click', closeModal);
    if (entryCategoryElement) entryCategoryElement.addEventListener('change', handleCategoryChange);
    if (calendarGrid) {
        calendarGrid.addEventListener('click', (event) => {
            let target = event.target;
            while (target && !target.dataset.date && target !== calendarGrid) target = target.parentElement;
            if (target && target.dataset.date && !event.target.classList.contains('calendar-entry')) {
                const existingEntry = entries.find(entry => entry.date === target.dataset.date); // Check against all entries, not just filtered
                if (existingEntry) openModal(existingEntry.date, existingEntry);
                else openModal(target.dataset.date);
            }
        });
    }
    window.addEventListener('click', (event) => { if (event.target === entryModal) closeModal(); });

    // --- Entry Form Submission (Save/Edit/Delete) ---
    if (entryForm) {
        entryForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const formData = new FormData(entryForm);
            const entryData = { /* ... create entryData object ... */
                id: editingEntryId || Date.now().toString(),
                date: formData.get('entry-date'),
                category: formData.get('entry-category'),
                status: formData.get('entry-status'),
                notes: formData.get('entry-notes')
            };
            if (entryData.category === 'work_ship') entryData.shipName = formData.get('ship-name');
            else if (entryData.category === 'work_land') entryData.country = formData.get('country');

            const existingEntryOnDate = entries.find(entry => entry.date === entryData.date && entry.id !== entryData.id);
            if (existingEntryOnDate && !editingEntryId) {
                alert(`An entry already exists for ${entryData.date}. Please edit the existing entry or choose a different date.`); return;
            }
            if (editingEntryId) {
                const originalEntry = entries.find(e => e.id === editingEntryId);
                if (originalEntry && originalEntry.date !== entryData.date && existingEntryOnDate) {
                     alert(`An entry already exists for ${entryData.date}. Please choose a different date.`); return;
                }
                const index = entries.findIndex(entry => entry.id === editingEntryId);
                if (index !== -1) entries[index] = entryData;
            } else {
                entries.push(entryData);
            }
            closeModal();
            renderCalendar();
            updateDashboard();
        });
    }
    if (deleteEntryButton) {
        deleteEntryButton.addEventListener('click', () => {
            if (editingEntryId) {
                entries = entries.filter(entry => entry.id !== editingEntryId);
                closeModal();
                renderCalendar();
                updateDashboard();
            }
        });
    }

    // --- Dashboard Logic ---
    function updateDashboard() {
        const totalWorkShip = document.getElementById('total-work-ship');
        const workShipBreakdown = document.getElementById('work-ship-breakdown');
        const totalWorkLand = document.getElementById('total-work-land');
        const workLandBreakdown = document.getElementById('work-land-breakdown');
        const totalVacation = document.getElementById('total-vacation');
        const totalTravel = document.getElementById('total-travel');

        // Compliance section UI elements
        const cpStatusTextEl = document.getElementById('cp-status-text');
        const cpStatusIndicatorEl = document.getElementById('cp-status-indicator');
        const cpStatusReasonEl = document.getElementById('cp-status-reason');
        const cDaysOutsideUkEl = document.getElementById('c-days-outside-uk');
        const cDaysOutsideUkTargetEl = document.getElementById('c-days-outside-uk-target');
        const cDaysOutsideUkIndicatorEl = document.getElementById('c-days-outside-uk-indicator');
        const cDaysOutsideUkDetailEl = document.getElementById('c-days-outside-uk-detail');
        const cDaysInUkEl = document.getElementById('c-days-in-uk');
        const cTotalPeriodDaysEl = document.getElementById('c-total-period-days');
        const cUkHalfRuleIndicatorEl = document.getElementById('c-uk-half-rule-indicator');
        const cUkHalfRuleDetailEl = document.getElementById('c-uk-half-rule-detail');
        const cLongestUkVisitEl = document.getElementById('c-longest-uk-visit');
        const cUkVisitLimitEl = document.getElementById('c-uk-visit-limit');
        const cLongestUkVisitIndicatorEl = document.getElementById('c-longest-uk-visit-indicator');
        const cLongestUkVisitDetailEl = document.getElementById('c-longest-uk-visit-detail');
        const cLongestVoyageGapEl = document.getElementById('c-longest-voyage-gap');
        const cVoyageGapLimitEl = document.getElementById('c-voyage-gap-limit');
        const cLongestVoyageGapIndicatorEl = document.getElementById('c-longest-voyage-gap-indicator');
        const cVoyageGapDetailsEl = document.getElementById('c-voyage-gap-details');

        if (!totalWorkShip || !cpStatusTextEl) return; // Core dashboard/compliance elements not found

        // Use ALL entries for dashboard summary, not filtered ones. Filters apply to calendar.
        // Compliance will use its own period or all entries.
        const summaryEntries = entries; // For general dashboard totals. Filtered entries for compliance analysis is handled by getEntriesForPeriod.

        let workShipDays = 0; const shipCounts = {};
        let workLandDays = 0; const landCounts = {};
        let vacationDays = 0; let travelDays = 0;

        summaryEntries.forEach(entry => { // Iterate over ALL entries for summary
            if (entry.status === 'confirmed') {
                switch (entry.category) {
                    case 'work_ship': workShipDays++; shipCounts[entry.shipName || 'N/A'] = (shipCounts[entry.shipName || 'N/A'] || 0) + 1; break;
                    case 'work_land': workLandDays++; landCounts[entry.country || 'N/A'] = (landCounts[entry.country || 'N/A'] || 0) + 1; break;
                    case 'vacation': vacationDays++; break;
                    case 'travel': travelDays++; break;
                }
            }
        });
        totalWorkShip.textContent = workShipDays;
        workShipBreakdown.innerHTML = '';
        Object.entries(shipCounts).forEach(([name, count]) => { const li = document.createElement('li'); li.textContent = `${name}: ${count} days`; workShipBreakdown.appendChild(li); });
        totalWorkLand.textContent = workLandDays;
        workLandBreakdown.innerHTML = '';
        Object.entries(landCounts).forEach(([name, count]) => { const li = document.createElement('li'); li.textContent = `${name}: ${count} days`; workLandBreakdown.appendChild(li); });
        totalVacation.textContent = vacationDays;
        totalTravel.textContent = travelDays;

        // Defer compliance update to a separate function, called by Analyze button or when dashboard loads with dates
        // For now, clear the compliance fields if no analysis has been run.
        clearComplianceResults();
    }

    function clearComplianceResults() {
        const elementsToClear = [
            'cp-status-text', 'c-days-outside-uk', 'c-days-outside-uk-target',
            'c-days-in-uk', 'c-total-period-days', 'c-longest-uk-visit',
            'c-longest-voyage-gap'
        ];
        elementsToClear.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = '--';
        });
        const indicatorsToClear = [
            'cp-status-indicator', 'c-days-outside-uk-indicator', 'c-uk-half-rule-indicator',
            'c-longest-uk-visit-indicator', 'c-longest-voyage-gap-indicator'
        ];
        indicatorsToClear.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.className = 'status-indicator';
        });
        const detailsToClear = [
            'cp-status-reason', 'c-days-outside-uk-detail', 'c-uk-half-rule-detail',
            'c-longest-uk-visit-detail', 'c-voyage-gap-details'
        ];
        detailsToClear.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                if (el.tagName === 'UL') el.innerHTML = ''; else el.textContent = '';
            }
        });
        document.getElementById('c-uk-visit-limit').textContent = "183"; // Reset defaults if needed
        document.getElementById('c-voyage-gap-limit').textContent = "183";
    }


    function runAndDisplayComplianceAnalysis() {
        const periodStartInput = document.getElementById('claim-period-start').value;
        const periodEndInput = document.getElementById('claim-period-end').value;

        let periodStart = periodStartInput;
        let periodEnd = periodEndInput;

        if (!periodStart || !periodEnd) {
            // Default to last 365 days from latest entry if no period specified
            if (entries.length > 0) {
                const latestEntryDate = new Date(Math.max(...entries.map(e => new Date(e.date))));
                periodEnd = latestEntryDate.toISOString().split('T')[0];
                const pStart = new Date(latestEntryDate);
                pStart.setDate(pStart.getDate() - 364); // 365 days total
                periodStart = pStart.toISOString().split('T')[0];

                // Update UI to show default dates being used
                document.getElementById('claim-period-start').value = periodStart;
                document.getElementById('claim-period-end').value = periodEnd;

            } else {
                alert("Please add some entries or define a claim period.");
                clearComplianceResults();
                return;
            }
        }

        // --- Update UI Elements ---
        const cpStatusTextEl = document.getElementById('cp-status-text');
        const cpStatusIndicatorEl = document.getElementById('cp-status-indicator');
        const cpStatusReasonEl = document.getElementById('cp-status-reason');
        const cDaysOutsideUkEl = document.getElementById('c-days-outside-uk');
        const cDaysOutsideUkTargetEl = document.getElementById('c-days-outside-uk-target');
        const cDaysOutsideUkIndicatorEl = document.getElementById('c-days-outside-uk-indicator');
        const cDaysOutsideUkDetailEl = document.getElementById('c-days-outside-uk-detail');
        const cDaysInUkEl = document.getElementById('c-days-in-uk');
        const cTotalPeriodDaysEl = document.getElementById('c-total-period-days');
        const cUkHalfRuleIndicatorEl = document.getElementById('c-uk-half-rule-indicator');
        const cUkHalfRuleDetailEl = document.getElementById('c-uk-half-rule-detail');
        const cLongestUkVisitEl = document.getElementById('c-longest-uk-visit');
        const cUkVisitLimitEl = document.getElementById('c-uk-visit-limit'); // Target value display
        const cLongestUkVisitIndicatorEl = document.getElementById('c-longest-uk-visit-indicator');
        const cLongestUkVisitDetailEl = document.getElementById('c-longest-uk-visit-detail');
        const cLongestVoyageGapEl = document.getElementById('c-longest-voyage-gap');
        const cVoyageGapLimitEl = document.getElementById('c-voyage-gap-limit'); // Target value display
        const cLongestVoyageGapIndicatorEl = document.getElementById('c-longest-voyage-gap-indicator');
        const cVoyageGapDetailsEl = document.getElementById('c-voyage-gap-details');


        const MIN_CLAIM_DAYS = 365;
        const UK_VISIT_LIMIT_DAYS = 183; // Statutory limit for SED
        const UK_VISIT_WARNING_DAYS = 90; // Stricter internal warning
        const VOYAGE_GAP_LIMIT_DAYS = 183;

        cUkVisitLimitEl.textContent = UK_VISIT_LIMIT_DAYS;
        cVoyageGapLimitEl.textContent = VOYAGE_GAP_LIMIT_DAYS;

        const periodValidity = isClaimPeriodValid(periodStart, periodEnd, MIN_CLAIM_DAYS);
        cpStatusIndicatorEl.className = 'status-indicator'; // Reset
        cpStatusReasonEl.textContent = periodValidity.reason;
        if (!periodValidity.isValid) {
            cpStatusTextEl.textContent = "Invalid Period";
            cpStatusIndicatorEl.classList.add('red');
            // Clear other results as period is invalid
            cDaysOutsideUkEl.textContent = '--'; cDaysOutsideUkTargetEl.textContent = '--'; cDaysOutsideUkIndicatorEl.className = 'status-indicator'; cDaysOutsideUkDetailEl.textContent = '';
            cDaysInUkEl.textContent = '--'; cTotalPeriodDaysEl.textContent = '--'; cUkHalfRuleIndicatorEl.className = 'status-indicator'; cUkHalfRuleDetailEl.textContent = '';
            cLongestUkVisitEl.textContent = '--'; cLongestUkVisitIndicatorEl.className = 'status-indicator'; cLongestUkVisitDetailEl.textContent = '';
            cLongestVoyageGapEl.textContent = '--'; cLongestVoyageGapIndicatorEl.className = 'status-indicator'; cVoyageGapDetailsEl.innerHTML = '';
            return;
        }

        cpStatusTextEl.textContent = "Valid Period"; // Default, can be overridden by specific rule failures
        cpStatusIndicatorEl.classList.add('green');
        const totalDaysInPeriod = periodValidity.currentLength;
        cTotalPeriodDaysEl.textContent = totalDaysInPeriod;

        const relevantEntries = getEntriesForPeriod(entries, periodStart, periodEnd, "confirmed");

        // Rule 2: Days Outside UK (Half-out rule for SED is often more nuanced, but simplified here)
        const daysOutside = calculateDaysOutsideUK(relevantEntries);
        const daysOutsideTarget = Math.ceil(totalDaysInPeriod / 2); // Simplified: at least half
        cDaysOutsideUkEl.textContent = daysOutside;
        cDaysOutsideUkTargetEl.textContent = daysOutsideTarget;
        cDaysOutsideUkIndicatorEl.className = 'status-indicator';
        if (daysOutside >= daysOutsideTarget) {
            cDaysOutsideUkIndicatorEl.classList.add('green');
            cDaysOutsideUkDetailEl.textContent = "Pass: Sufficient days outside UK.";
        } else {
            cDaysOutsideUkIndicatorEl.classList.add('red');
            cDaysOutsideUkDetailEl.textContent = `Fail: Only ${daysOutside} of ${daysOutsideTarget} required days outside UK.`;
            cpStatusTextEl.textContent = "Non-Compliant"; cpStatusIndicatorEl.className = 'status-indicator red';
        }

        // Rule: Days in UK vs Total (Max 50% in UK) - This is essentially the same as above but framed differently.
        const daysIn = calculateDaysInUK(relevantEntries); // This only counts UK Work Land for now
        cDaysInUkEl.textContent = daysIn;
        cUkHalfRuleIndicatorEl.className = 'status-indicator';
        if (daysIn <= totalDaysInPeriod - daysOutsideTarget) { // daysIn <= (totalDays - daysOutsideTarget)
            cUkHalfRuleIndicatorEl.classList.add('green');
            cUkHalfRuleDetailEl.textContent = "Pass: UK days do not exceed allowed limit relative to days abroad.";
        } else {
            cUkHalfRuleIndicatorEl.classList.add('red');
            cUkHalfRuleDetailEl.textContent = `Fail: ${daysIn} UK days is too many for a ${totalDaysInPeriod} day period if aiming for half out.`;
            // cpStatusTextEl.textContent = "Non-Compliant"; cpStatusIndicatorEl.className = 'status-indicator red'; // Already set if daysOutside fails
        }

        // Rule 4: UK Visit Limit
        const ukVisitCheck = checkUKVisitLimit(relevantEntries, UK_VISIT_LIMIT_DAYS);
        cLongestUkVisitEl.textContent = ukVisitCheck.maxStreak;
        cLongestUkVisitIndicatorEl.className = 'status-indicator';
        if (ukVisitCheck.exceedsLimit) {
            cLongestUkVisitIndicatorEl.classList.add('red');
            cLongestUkVisitDetailEl.textContent = `Fail: Longest UK visit of ${ukVisitCheck.maxStreak} days exceeds ${UK_VISIT_LIMIT_DAYS} day limit.`;
            cpStatusTextEl.textContent = "Non-Compliant"; cpStatusIndicatorEl.className = 'status-indicator red';
        } else if (ukVisitCheck.maxStreak > UK_VISIT_WARNING_DAYS) {
            cLongestUkVisitIndicatorEl.classList.add('yellow');
            cLongestUkVisitDetailEl.textContent = `Warning: Longest UK visit of ${ukVisitCheck.maxStreak} days is approaching the ${UK_VISIT_LIMIT_DAYS} day limit (Warning at ${UK_VISIT_WARNING_DAYS}).`;
        } else {
            cLongestUkVisitIndicatorEl.classList.add('green');
            cLongestUkVisitDetailEl.textContent = "Pass: No single UK visit exceeds limit.";
        }

        // Rule 5: Gap Between Voyages
        const voyageGapCheck = checkVoyageGaps(relevantEntries, VOYAGE_GAP_LIMIT_DAYS);
        cLongestVoyageGapEl.textContent = voyageGapCheck.maxGap;
        cLongestVoyageGapIndicatorEl.className = 'status-indicator';
        cVoyageGapDetailsEl.innerHTML = ''; // Clear previous details
        if (voyageGapCheck.exceedsLimit) {
            cLongestVoyageGapIndicatorEl.classList.add('red');
            voyageGapCheck.gaps.forEach(gap => {
                const li = document.createElement('li');
                li.textContent = `Gap of ${gap.gap} days (after ${gap.endDate}, before ${gap.nextStartDate}) exceeds ${VOYAGE_GAP_LIMIT_DAYS} day limit.`;
                cVoyageGapDetailsEl.appendChild(li);
            });
            if (voyageGapCheck.gaps.length === 0 && voyageGapCheck.maxGap > 0) { // Max gap exceeded but no specific gaps listed (e.g. only 1 gap)
                 const li = document.createElement('li');
                 li.textContent = `A maximum gap of ${voyageGapCheck.maxGap} days was found, exceeding the ${VOYAGE_GAP_LIMIT_DAYS} day limit.`;
                 cVoyageGapDetailsEl.appendChild(li);
            }
            cpStatusTextEl.textContent = "Non-Compliant"; cpStatusIndicatorEl.className = 'status-indicator red';
        } else {
            cLongestVoyageGapIndicatorEl.classList.add('green');
            const li = document.createElement('li');
            li.textContent = "Pass: No voyage gaps exceed limit.";
            cVoyageGapDetailsEl.appendChild(li);
        }
         if (voyageGapCheck.maxGap === 0 && relevantEntries.filter(e=>e.category === 'work_ship').length < 2 && relevantEntries.filter(e=>e.category === 'work_ship').length > 0) {
            const li = document.createElement('li');
            li.textContent = "Not enough voyages in period to calculate gaps.";
            cVoyageGapDetailsEl.innerHTML = '';
            cVoyageGapDetailsEl.appendChild(li);
        }


        // Final overall status
        if (cpStatusTextEl.textContent !== "Non-Compliant" && cpStatusTextEl.textContent !== "Invalid Period") {
             cpStatusTextEl.textContent = "Compliant (Simplified)";
             cpStatusIndicatorEl.className = 'status-indicator green';
        }
    }

    const analyzeComplianceButton = document.getElementById('analyze-compliance-button');
    if (analyzeComplianceButton) {
        analyzeComplianceButton.addEventListener('click', runAndDisplayComplianceAnalysis);
    }

    // Auto-analyze when dashboard is shown if dates are populated
    // This is handled by the main navigation logic calling updateDashboard,
    // which now calls clearComplianceResults. The user has to click "Analyze".
    // Or we can trigger analysis if dates are present:
    if (navLinks) { // Re-check navLinks to ensure this runs after main nav setup
        const navDashboardLink = document.getElementById('nav-dashboard');
        if (navDashboardLink) {
            navDashboardLink.addEventListener('click', () => {
                // updateDashboard() is already called, which now clears results.
                // User must click Analyze. This is fine.
                // Optionally, auto-run if dates are filled:
                // const periodStartInput = document.getElementById('claim-period-start').value;
                // const periodEndInput = document.getElementById('claim-period-end').value;
                // if(periodStartInput && periodEndInput) runAndDisplayComplianceAnalysis();
            });
        }
    }


    // --- Filtering Logic ---

        let workShipDays = 0; const shipCounts = {};
        let workLandDays = 0; const landCounts = {};
        let vacationDays = 0; let travelDays = 0;

        dashboardEntries.forEach(entry => { // Iterate over filtered entries
            if (entry.status === 'confirmed') {
                switch (entry.category) {
                    case 'work_ship': workShipDays++; shipCounts[entry.shipName || 'N/A'] = (shipCounts[entry.shipName || 'N/A'] || 0) + 1; break;
                    case 'work_land': workLandDays++; landCounts[entry.country || 'N/A'] = (landCounts[entry.country || 'N/A'] || 0) + 1; break;
                    case 'vacation': vacationDays++; break;
                    case 'travel': travelDays++; break;
                }
            }
        });
        totalWorkShip.textContent = workShipDays;
        workShipBreakdown.innerHTML = '';
        Object.entries(shipCounts).forEach(([name, count]) => { const li = document.createElement('li'); li.textContent = `${name}: ${count} days`; workShipBreakdown.appendChild(li); });
        totalWorkLand.textContent = workLandDays;
        workLandBreakdown.innerHTML = '';
        Object.entries(landCounts).forEach(([name, count]) => { const li = document.createElement('li'); li.textContent = `${name}: ${count} days`; workLandBreakdown.appendChild(li); });
        totalVacation.textContent = vacationDays;
        totalTravel.textContent = travelDays;

        // Basic Compliance Calculations (Placeholders / Highly Simplified)
        // Rule 1: Days outside UK (e.g., sum of Work Ship and Work Land outside UK)
        let daysOutsideUK = 0;
        dashboardEntries.forEach(entry => {
            if (entry.status === 'confirmed') {
                if (entry.category === 'work_ship') { // Assume all work_ship is outside UK for this basic version
                    daysOutsideUK++;
                } else if (entry.category === 'work_land' && entry.country && entry.country.toLowerCase() !== 'uk' && entry.country.toLowerCase() !== 'united kingdom') {
                    daysOutsideUK++;
                }
                // Travel days might also count depending on context, simplifying for now
            }
        });
        complianceDaysOutsideUkEl.textContent = daysOutsideUK;
        const daysOutsideUkTarget = 183; // Example target
        document.getElementById('compliance-days-outside-uk-target').textContent = daysOutsideUkTarget;
        complianceDaysStatusEl.className = 'status-indicator'; // Reset
        if (daysOutsideUK >= daysOutsideUkTarget) {
            complianceDaysStatusEl.classList.add('green');
        } else if (daysOutsideUK > daysOutsideUkTarget * 0.8) { // Example: >80% is warning
            complianceDaysStatusEl.classList.add('yellow');
        } else {
            complianceDaysStatusEl.classList.add('red');
        }

        // Rule 2: Max continuous UK days (very simplified - just counts UK land days for now)
        let ukLandDays = 0;
        dashboardEntries.forEach(entry => {
            if (entry.status === 'confirmed' && entry.category === 'work_land' && (entry.country && (entry.country.toLowerCase() === 'uk' || entry.country.toLowerCase() === 'united kingdom'))) {
                ukLandDays++;
            }
        });
        complianceMaxUkDaysEl.textContent = ukLandDays; // This is NOT continuous, just total UK land days
        const maxUkDaysLimit = 90; // Example limit
        document.getElementById('compliance-max-uk-days-limit').textContent = maxUkDaysLimit;
        complianceUkDaysStatusEl.className = 'status-indicator'; // Reset
        if (ukLandDays < maxUkDaysLimit * 0.5) { // Example: <50% is green
             complianceUkDaysStatusEl.classList.add('green');
        } else if (ukLandDays < maxUkDaysLimit) {
            complianceUkDaysStatusEl.classList.add('yellow');
        } else {
            complianceUkDaysStatusEl.classList.add('red');
        }

        // Rule 3: Voyage Gaps (Placeholder)
        complianceVoyageGapsEl.textContent = "Not Implemented"; // Placeholder

    }

    // --- Filtering Logic ---
    if (applyFiltersButton) {
        applyFiltersButton.addEventListener('click', () => {
            currentFilters.dateStart = filterDateStartElement.value;
            currentFilters.dateEnd = filterDateEndElement.value;
            currentFilters.category = filterCategoryElement.value;
            currentFilters.keyword = filterKeywordElement.value;
            renderCalendar();
            updateDashboard(); // Update dashboard with filtered results
        });
    }
    if (resetFiltersButton) {
        resetFiltersButton.addEventListener('click', () => {
            filterForm.reset();
            currentFilters = { dateStart: '', dateEnd: '', category: '', keyword: '' };
            renderCalendar();
            updateDashboard(); // Update dashboard with all results
        });
    }

    // --- Initial Render ---
    renderCalendar();
    // updateDashboard(); // Initial dashboard update if needed

    // --- Compliance Helper Functions ---
    const UK_ALIASES = ['uk', 'united kingdom', 'gb', 'great britain', 'england', 'scotland', 'wales', 'northern ireland'];
    function isUK(countryName) {
        if (!countryName) return false; // A land day with no country specified will not be counted as UK.
        return UK_ALIASES.includes(countryName.toLowerCase().trim());
    }

    /**
     * Filters entries for a given period and status.
     * @param {Array} allEntries - Array of all entry objects.
     * @param {string} periodStart - YYYY-MM-DD string.
     * @param {string} periodEnd - YYYY-MM-DD string.
     * @param {string} status - Entry status to filter by (e.g., "confirmed").
     * @returns {Array} Filtered entries.
     */
    function getEntriesForPeriod(allEntries, periodStart, periodEnd, status = "confirmed") {
        const start = new Date(periodStart);
        const end = new Date(periodEnd);
        return allEntries.filter(entry => {
            const entryDate = new Date(entry.date);
            return entry.status === status && entryDate >= start && entryDate <= end;
        });
    }

    // --- Core Compliance Calculation Functions ---

    /**
     * Calculates days spent outside the UK within a given period.
     * Counts 'Work Ship' days and 'Work Land' (non-UK) days.
     * Travel and Vacation days are currently NOT directly counted towards this
     * unless future enhancements link them to non-UK locations.
     */
    function calculateDaysOutsideUK(relevantEntries) {
        let count = 0;
        relevantEntries.forEach(entry => {
            if (entry.category === 'work_ship') {
                count++;
            } else if (entry.category === 'work_land' && entry.country && !isUK(entry.country)) {
                count++;
            }
            // TODO: Future: Consider rules for attributing travel/vacation days if location data is added.
        });
        return count;
    }

    /**
     * Calculates days spent inside the UK within a given period.
     * Counts 'Work Land' (UK) days.
     * Travel and Vacation days in the UK are currently NOT directly counted here
     * unless future enhancements link them to UK locations.
     */
    function calculateDaysInUK(relevantEntries) {
        let count = 0;
        relevantEntries.forEach(entry => {
            if (entry.category === 'work_land' && isUK(entry.country)) {
                count++;
            }
            // TODO: Future: Consider rules for attributing travel/vacation days if location data is added.
        });
        return count;
    }

    /**
     * Checks for any continuous stays in the UK exceeding a specified limit.
     * This is a simplified check based on consecutive 'Work Land (UK)' days.
     * More sophisticated logic would consider all types of days spent in UK.
     */
    function checkUKVisitLimit(relevantEntries, limit) {
        let currentUKStreak = 0;
        let maxUKStreak = 0;
        // Entries should be sorted by date for this to work correctly.
        // Assuming relevantEntries are already sorted if they come from getEntriesForPeriod and then sorted.
        const sortedEntries = [...relevantEntries].sort((a, b) => new Date(a.date) - new Date(b.date));

        for (let i = 0; i < sortedEntries.length; i++) {
            const entry = sortedEntries[i];
            let dayInUK = false;

            if (entry.category === 'work_land' && isUK(entry.country)) {
                dayInUK = true;
            }
            // Basic assumption: Vacation/Travel days interrupt a UK work streak unless also in UK.
            // For this simplified version, only UK work land contributes to the streak.
            // Other UK days (vacation, travel in UK) would make this more complex.

            if (dayInUK) {
                currentUKStreak++;
                if (i < sortedEntries.length - 1) {
                    const nextEntryDate = new Date(sortedEntries[i+1].date);
                    const currentEntryDate = new Date(entry.date);
                    const diffDays = (nextEntryDate - currentEntryDate) / (1000 * 60 * 60 * 24);
                    if (diffDays > 1) { // Gap in entries, streak broken
                        maxUKStreak = Math.max(maxUKStreak, currentUKStreak);
                        currentUKStreak = 0;
                    }
                }
            } else {
                maxUKStreak = Math.max(maxUKStreak, currentUKStreak);
                currentUKStreak = 0;
            }
        }
        maxUKStreak = Math.max(maxUKStreak, currentUKStreak); // Final check for streak at the end
        return { maxStreak: maxUKStreak, exceedsLimit: maxUKStreak > limit };
    }

    /**
     * Checks for gaps between 'Work Ship' periods exceeding a specified limit.
     */
    function checkVoyageGaps(relevantEntries, limit) {
        const workShipEntries = relevantEntries
            .filter(entry => entry.category === 'work_ship')
            .sort((a,b) => new Date(a.date) - new Date(b.date));

        if (workShipEntries.length < 2) {
            return { maxGap: 0, exceedsLimit: false, gaps: [] }; // Not enough voyages to have a gap
        }

        let maxGap = 0;
        const gaps = [];
        for (let i = 0; i < workShipEntries.length - 1; i++) {
            const voyageEndDate = new Date(workShipEntries[i].date);
            const nextVoyageStartDate = new Date(workShipEntries[i+1].date);
            // Gap is from the day after voyageEndDate to the day before nextVoyageStartDate
            const gapDays = (nextVoyageStartDate - voyageEndDate) / (1000 * 60 * 60 * 24) - 1;

            if (gapDays > 0) { // Only consider actual gaps
               maxGap = Math.max(maxGap, gapDays);
               if (gapDays > limit) {
                   gaps.push({
                       gap: gapDays,
                       endDate: workShipEntries[i].date,
                       nextStartDate: workShipEntries[i+1].date
                   });
               }
            }
        }
        return { maxGap: maxGap, exceedsLimit: maxGap > limit, gaps: gaps };
    }

    /**
     * Checks if the claim period itself is valid (e.g., minimum length).
     */
    function isClaimPeriodValid(periodStart, periodEnd, minLengthDays = 365) {
        if (!periodStart || !periodEnd) return { isValid: false, reason: "Claim period start or end date not specified." };
        const start = new Date(periodStart);
        const end = new Date(periodEnd);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) return {isValid: false, reason: "Invalid claim period dates."};
        if (start > end) return { isValid: false, reason: "Claim period start date cannot be after end date." };

        const lengthDays = (end - start) / (1000 * 60 * 60 * 24) + 1;
        if (lengthDays < minLengthDays) {
            return { isValid: false, reason: `Claim period is ${lengthDays} days. Minimum ${minLengthDays} days required.`, currentLength: lengthDays };
        }
        return { isValid: true, reason: "", currentLength: lengthDays };
    }

    // --- CSV Export ---
    const exportCsvButton = document.getElementById('export-csv-button');
    if (exportCsvButton) {
        exportCsvButton.addEventListener('click', () => {
            exportEntriesToCsv(entries); // Export all entries, not just filtered ones
        });
    }

    function escapeCsvCell(cellData) {
        if (cellData === null || cellData === undefined) {
            return '';
        }
        const stringData = String(cellData);
        // If the data contains a comma, newline, or double quote, enclose it in double quotes
        if (stringData.includes(',') || stringData.includes('\n') || stringData.includes('"')) {
            // Within a double-quoted field, double quotes must be escaped by another double quote
            return `"${stringData.replace(/"/g, '""')}"`;
        }
        return stringData;
    }

    function exportEntriesToCsv(entriesToExport) {
        if (!entriesToExport || entriesToExport.length === 0) {
            alert('No data to export.');
            return;
        }

        const headers = ['ID', 'Date', 'Category', 'Status', 'Ship Name', 'Country', 'Notes'];
        const csvRows = [];
        csvRows.push(headers.map(escapeCsvCell).join(',')); // Add header row, ensuring headers are also escaped if necessary

        entriesToExport.forEach(entry => {
            const row = [
                escapeCsvCell(entry.id),
                escapeCsvCell(entry.date),
                escapeCsvCell(entry.category.replace('_', ' ')), // Make category more readable
                escapeCsvCell(entry.status),
                escapeCsvCell(entry.shipName),
                escapeCsvCell(entry.country),
                escapeCsvCell(entry.notes)
            ];
            csvRows.push(row.join(','));
        });

        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) { // Feature detection
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', 'sed_tracker_data.csv');
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } else {
            alert('CSV export is not supported in your browser.');
        }
    }
});
