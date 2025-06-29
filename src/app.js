document.addEventListener('DOMContentLoaded', () => {
    console.log('SED Tracker App Initialized - Backend Version');

    // --- API Configuration ---
    const API_BASE_URL = '/api'; // Using relative path for API calls

    // --- Elements (assuming they are the same as before) ---
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
    const filterForm = document.getElementById('filter-form');
    const filterDateStartElement = document.getElementById('filter-date-start');
    const filterDateEndElement = document.getElementById('filter-date-end');
    const filterCategoryElement = document.getElementById('filter-category');
    const filterKeywordElement = document.getElementById('filter-keyword');
    const applyFiltersButton = document.getElementById('apply-filters');
    const resetFiltersButton = document.getElementById('reset-filters');
    const exportCsvButton = document.getElementById('export-csv-button');
    const analyzeComplianceButton = document.getElementById('analyze-compliance-button');


    // --- State ---
    let currentDate = new Date();
    let localEntriesCache = []; // Local cache of entries fetched from backend
    let editingEntryId = null;
    let currentFilters = { dateStart: '', dateEnd: '', category: '', keyword: '' };

    // --- API Helper Functions ---
    async function fetchApi(endpoint, options = {}) {
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: "Network response was not ok", details: response.statusText }));
                console.error('API Error:', errorData);
                alert(`API Error: ${errorData.error} - ${errorData.details || response.statusText}`);
                throw new Error(errorData.error || response.statusText);
            }
            if (response.status === 204 || response.headers.get("content-length") === "0") { // No Content
                return null;
            }
            return await response.json();
        } catch (error) {
            console.error('Fetch operation error:', error);
            alert(`Operation failed: ${error.message}. Check console for details.`);
            throw error; // Re-throw to allow calling function to handle
        }
    }

    async function loadEntries() {
        try {
            const data = await fetchApi('/entries');
            localEntriesCache = data || [];
            renderCalendar();
            updateDashboard(); // Also updates compliance section if visible and dates set
        } catch (error) {
            // Error already alerted by fetchApi
            localEntriesCache = []; // Reset cache on error
            renderCalendar(); // Render empty calendar
            updateDashboard();
        }
    }

    // --- Utility Functions (getFilteredEntries, isUK, getEntriesForPeriod) ---
    // These functions now operate on localEntriesCache
    function getFilteredEntries() {
        return localEntriesCache.filter(entry => {
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
                if (!shipName.includes(keyword) && !country.includes(keyword) && !notes.includes(keyword)) return false;
            }
            return true;
        });
    }
    const UK_ALIASES = ['uk', 'united kingdom', 'gb', 'great britain', 'england', 'scotland', 'wales', 'northern ireland'];
    function isUK(countryName) {
        if (!countryName) return false;
        return UK_ALIASES.includes(countryName.toLowerCase().trim());
    }
    function getEntriesForPeriod(allEntries, periodStart, periodEnd, status = "confirmed") {
        const start = new Date(periodStart);
        const end = new Date(periodEnd);
        return allEntries.filter(entry => {
            const entryDate = new Date(entry.date);
            return entry.status === status && entryDate >= start && entryDate <= end;
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
                    updateDashboard(); // This will also trigger compliance re-check if needed
                }
            });
        });
    });
    // Initial view setup
    if (document.getElementById('add-entry-view')) document.getElementById('add-entry-view').style.display = 'none';
    if (document.getElementById('reports-view')) document.getElementById('reports-view').style.display = 'none';
    if (document.getElementById('compliance-view')) document.getElementById('compliance-view').style.display = 'none';
    if (calendarView) calendarView.style.display = 'block';
    if (dashboardView) dashboardView.style.display = 'none';


    // --- Calendar Rendering (Uses getFilteredEntries which uses localEntriesCache) ---
    function renderCalendar() {
        if (!calendarGrid || !monthYearElement) return;
        calendarGrid.innerHTML = '';
        const month = currentDate.getMonth();
        const year = currentDate.getFullYear();
        monthYearElement.textContent = `${currentDate.toLocaleString('default', { month: 'long' })} ${year}`;
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        dayNames.forEach(name => {
            const dayNameCell = document.createElement('div');
            dayNameCell.classList.add('day-name');
            dayNameCell.textContent = name;
            calendarGrid.appendChild(dayNameCell);
        });
        for (let i = 0; i < firstDayOfMonth; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.classList.add('empty-day');
            calendarGrid.appendChild(emptyCell);
        }
        const visibleEntries = getFilteredEntries();
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
                    const originalEntry = localEntriesCache.find(e => e.id === entry.id); // Find from original cache
                    if (originalEntry) openModal(originalEntry.date, originalEntry);
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
            editingEntryId = entryToEdit.id; // This should be the backend-generated ID
            modalTitleElement.textContent = `Edit Entry for ${dateString}`;
            entryCategoryElement.value = entryToEdit.category;
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
        if(entryModal) entryModal.style.display = 'block';
    }
    function closeModal() { if(entryModal) entryModal.style.display = 'none'; editingEntryId = null; }
    function handleCategoryChange() {
        if (!entryCategoryElement || !workShipFields || !workLandFields) return;
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
                const existingEntry = localEntriesCache.find(entry => entry.date === target.dataset.date);
                if (existingEntry) openModal(existingEntry.date, existingEntry);
                else openModal(target.dataset.date);
            }
        });
    }
    window.addEventListener('click', (event) => { if (event.target === entryModal) closeModal(); });

    // --- Entry Form Submission (Save/Edit/Delete) ---
    if (entryForm) {
        entryForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const formData = new FormData(entryForm);
            const entryPayload = { // Renamed to avoid conflict with 'Entry' model name if it were global
                date: formData.get('entry-date'),
                category: formData.get('entry-category'),
                status: formData.get('entry-status'),
                notes: formData.get('entry-notes'),
                shipName: formData.get('ship-name') || null, // Ensure null if empty
                country: formData.get('country') || null,   // Ensure null if empty
            };
            if (entryPayload.category === 'work_ship') entryPayload.country = null;
            else if (entryPayload.category === 'work_land') entryPayload.shipName = null;
            else { entryPayload.shipName = null; entryPayload.country = null;}


            // Prevent overlapping entries (client-side check remains useful for immediate feedback)
            const existingEntryOnDate = localEntriesCache.find(
                entry => entry.date === entryPayload.date && entry.id !== editingEntryId
            );
            if (existingEntryOnDate && !editingEntryId) {
                alert(`An entry already exists for ${entryPayload.date}. Please edit the existing entry or choose a different date.`); return;
            }
            if (editingEntryId) { // Check if date is being changed to an existing entry's date
                const originalEntry = localEntriesCache.find(e => e.id === editingEntryId);
                if (originalEntry && originalEntry.date !== entryPayload.date && existingEntryOnDate) {
                     alert(`An entry already exists for ${entryPayload.date}. Please choose a different date.`); return;
                }
            }

            try {
                if (editingEntryId) { // Update
                    await fetchApi(`/entries/${editingEntryId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(entryPayload)
                    });
                } else { // Create
                    await fetchApi('/entries', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(entryPayload)
                    });
                }
                closeModal();
                await loadEntries(); // Reload all entries from backend to reflect changes
            } catch (error) {
                // Error already handled by fetchApi, but you could add specific UI updates here if needed
                console.error("Save/Update failed:", error);
            }
        });
    }
    if (deleteEntryButton) {
        deleteEntryButton.addEventListener('click', async () => {
            if (editingEntryId && confirm('Are you sure you want to delete this entry?')) {
                try {
                    await fetchApi(`/entries/${editingEntryId}`, { method: 'DELETE' });
                    closeModal();
                    await loadEntries(); // Reload entries
                } catch (error) {
                    console.error("Delete failed:", error);
                }
            }
        });
    }

    // --- Dashboard Logic (Uses getFilteredEntries for display, but calculations use all 'confirmed' from localEntriesCache) ---
    function updateDashboard() {
        const totalWorkShip = document.getElementById('total-work-ship');
        const workShipBreakdown = document.getElementById('work-ship-breakdown');
        const totalWorkLand = document.getElementById('total-work-land');
        const workLandBreakdown = document.getElementById('work-land-breakdown');
        const totalVacation = document.getElementById('total-vacation');
        const totalTravel = document.getElementById('total-travel');
        if (!totalWorkShip) return;

        const dashboardEntries = getFilteredEntries(); // For display consistency if filters are ever applied to dashboard totals
                                                    // However, compliance and core totals often use ALL relevant data.
                                                    // For this version, dashboard totals will reflect filtered data if filters are active.
                                                    // A more robust approach might have dashboard ignore display filters for its summary.
                                                    // For now, using filtered for simplicity of what `getFilteredEntries` returns.
                                                    // Let's change this to use ALL `localEntriesCache` for the summary totals.

        let workShipDays = 0; const shipCounts = {};
        let workLandDays = 0; const landCounts = {};
        let vacationDays = 0; let travelDays = 0;

        localEntriesCache.forEach(entry => { // Use all cached entries for totals
            if (entry.status === 'confirmed') {
                // Apply filters for dashboard summary as well for now
                const entryDate = new Date(entry.date);
                const startDate = currentFilters.dateStart ? new Date(currentFilters.dateStart) : null;
                const endDate = currentFilters.dateEnd ? new Date(currentFilters.dateEnd) : null;
                let passesDateFilter = true;
                if (startDate && entryDate < startDate) passesDateFilter = false;
                if (endDate && entryDate > endDate) passesDateFilter = false;

                let passesCategoryFilter = true;
                if (currentFilters.category && entry.category !== currentFilters.category) passesCategoryFilter = false;

                let passesKeywordFilter = true;
                if (currentFilters.keyword) {
                    const keyword = currentFilters.keyword.toLowerCase();
                    if (!( (entry.shipName || '').toLowerCase().includes(keyword) ||
                           (entry.country || '').toLowerCase().includes(keyword) ||
                           (entry.notes || '').toLowerCase().includes(keyword) )) {
                        passesKeywordFilter = false;
                    }
                }

                if (passesDateFilter && passesCategoryFilter && passesKeywordFilter) {
                    switch (entry.category) {
                        case 'work_ship': workShipDays++; shipCounts[entry.shipName || 'N/A'] = (shipCounts[entry.shipName || 'N/A'] || 0) + 1; break;
                        case 'work_land': workLandDays++; landCounts[entry.country || 'N/A'] = (landCounts[entry.country || 'N/A'] || 0) + 1; break;
                        case 'vacation': vacationDays++; break;
                        case 'travel': travelDays++; break;
                    }
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

        // Trigger compliance analysis update if the compliance section is visible
        // The runAndDisplayComplianceAnalysis itself will use its own date pickers or defaults
        // It will use the `localEntriesCache` for its source data.
        if (document.getElementById('compliance-summary-section') && document.getElementById('compliance-summary-section').style.display !== 'none') {
             // If claim period dates are set, could auto-run, or just clear and let user click "Analyze"
             // For now, just clearing and requiring "Analyze" button is fine after data changes.
            clearComplianceResults(); // Clear old results, user needs to click "Analyze"
        }
    }

    function clearComplianceResults() {
        const elementsToClear = ['cp-status-text', 'c-days-outside-uk', 'c-days-outside-uk-target', 'c-days-in-uk', 'c-total-period-days', 'c-longest-uk-visit', 'c-longest-voyage-gap'];
        elementsToClear.forEach(id => { const el = document.getElementById(id); if (el) el.textContent = '--'; });
        const indicatorsToClear = ['cp-status-indicator', 'c-days-outside-uk-indicator', 'c-uk-half-rule-indicator', 'c-longest-uk-visit-indicator', 'c-longest-voyage-gap-indicator'];
        indicatorsToClear.forEach(id => { const el = document.getElementById(id); if (el) el.className = 'status-indicator'; });
        const detailsToClear = ['cp-status-reason', 'c-days-outside-uk-detail', 'c-uk-half-rule-detail', 'c-longest-uk-visit-detail', 'c-voyage-gap-details'];
        detailsToClear.forEach(id => { const el = document.getElementById(id); if (el) { if (el.tagName === 'UL') el.innerHTML = ''; else el.textContent = ''; }});
        if(document.getElementById('c-uk-visit-limit')) document.getElementById('c-uk-visit-limit').textContent = "183";
        if(document.getElementById('c-voyage-gap-limit')) document.getElementById('c-voyage-gap-limit').textContent = "183";
    }

    function runAndDisplayComplianceAnalysis() {
        const periodStartInput = document.getElementById('claim-period-start').value;
        const periodEndInput = document.getElementById('claim-period-end').value;
        let periodStart = periodStartInput, periodEnd = periodEndInput;

        if (!periodStart || !periodEnd) {
            if (localEntriesCache.length > 0) {
                const latestEntryDate = new Date(Math.max(...localEntriesCache.map(e => new Date(e.date))));
                periodEnd = latestEntryDate.toISOString().split('T')[0];
                const pStart = new Date(latestEntryDate); pStart.setDate(pStart.getDate() - 364);
                periodStart = pStart.toISOString().split('T')[0];
                if(document.getElementById('claim-period-start')) document.getElementById('claim-period-start').value = periodStart;
                if(document.getElementById('claim-period-end')) document.getElementById('claim-period-end').value = periodEnd;
            } else { alert("Please add some entries or define a claim period."); clearComplianceResults(); return; }
        }

        const cpStatusTextEl = document.getElementById('cp-status-text'), cpStatusIndicatorEl = document.getElementById('cp-status-indicator'), cpStatusReasonEl = document.getElementById('cp-status-reason'),
              cDaysOutsideUkEl = document.getElementById('c-days-outside-uk'), cDaysOutsideUkTargetEl = document.getElementById('c-days-outside-uk-target'), cDaysOutsideUkIndicatorEl = document.getElementById('c-days-outside-uk-indicator'), cDaysOutsideUkDetailEl = document.getElementById('c-days-outside-uk-detail'),
              cDaysInUkEl = document.getElementById('c-days-in-uk'), cTotalPeriodDaysEl = document.getElementById('c-total-period-days'), cUkHalfRuleIndicatorEl = document.getElementById('c-uk-half-rule-indicator'), cUkHalfRuleDetailEl = document.getElementById('c-uk-half-rule-detail'),
              cLongestUkVisitEl = document.getElementById('c-longest-uk-visit'), cUkVisitLimitEl = document.getElementById('c-uk-visit-limit'), cLongestUkVisitIndicatorEl = document.getElementById('c-longest-uk-visit-indicator'), cLongestUkVisitDetailEl = document.getElementById('c-longest-uk-visit-detail'),
              cLongestVoyageGapEl = document.getElementById('c-longest-voyage-gap'), cVoyageGapLimitEl = document.getElementById('c-voyage-gap-limit'), cLongestVoyageGapIndicatorEl = document.getElementById('c-longest-voyage-gap-indicator'), cVoyageGapDetailsEl = document.getElementById('c-voyage-gap-details');

        const MIN_CLAIM_DAYS = 365, UK_VISIT_LIMIT_DAYS = 183, UK_VISIT_WARNING_DAYS = 90, VOYAGE_GAP_LIMIT_DAYS = 183;
        if(cUkVisitLimitEl) cUkVisitLimitEl.textContent = UK_VISIT_LIMIT_DAYS;
        if(cVoyageGapLimitEl) cVoyageGapLimitEl.textContent = VOYAGE_GAP_LIMIT_DAYS;

        const periodValidity = isClaimPeriodValid(periodStart, periodEnd, MIN_CLAIM_DAYS); // Uses global isClaimPeriodValid
        if(cpStatusIndicatorEl) cpStatusIndicatorEl.className = 'status-indicator';
        if(cpStatusReasonEl) cpStatusReasonEl.textContent = periodValidity.reason;
        if (!periodValidity.isValid) {
            if(cpStatusTextEl) cpStatusTextEl.textContent = "Invalid Period"; if(cpStatusIndicatorEl) cpStatusIndicatorEl.classList.add('red');
            clearComplianceResults(); // Clear more specifically or ensure only relevant parts are cleared
            return;
        }
        if(cpStatusTextEl) cpStatusTextEl.textContent = "Valid Period"; if(cpStatusIndicatorEl) cpStatusIndicatorEl.classList.add('green');
        const totalDaysInPeriod = periodValidity.currentLength;
        if(cTotalPeriodDaysEl) cTotalPeriodDaysEl.textContent = totalDaysInPeriod;
        const relevantEntries = getEntriesForPeriod(localEntriesCache, periodStart, periodEnd, "confirmed"); // Uses global

        const daysOutside = calculateDaysOutsideUK(relevantEntries); // Uses global
        const daysOutsideTarget = Math.ceil(totalDaysInPeriod / 2);
        if(cDaysOutsideUkEl) cDaysOutsideUkEl.textContent = daysOutside; if(cDaysOutsideUkTargetEl) cDaysOutsideUkTargetEl.textContent = daysOutsideTarget; if(cDaysOutsideUkIndicatorEl) cDaysOutsideUkIndicatorEl.className = 'status-indicator';
        if (daysOutside >= daysOutsideTarget) { if(cDaysOutsideUkIndicatorEl) cDaysOutsideUkIndicatorEl.classList.add('green'); if(cDaysOutsideUkDetailEl) cDaysOutsideUkDetailEl.textContent = "Pass: Sufficient days outside UK."; }
        else { if(cDaysOutsideUkIndicatorEl) cDaysOutsideUkIndicatorEl.classList.add('red'); if(cDaysOutsideUkDetailEl) cDaysOutsideUkDetailEl.textContent = `Fail: Only ${daysOutside} of ${daysOutsideTarget} required days outside UK.`; if(cpStatusTextEl) cpStatusTextEl.textContent = "Non-Compliant"; if(cpStatusIndicatorEl) cpStatusIndicatorEl.className = 'status-indicator red'; }

        const daysIn = calculateDaysInUK(relevantEntries); // Uses global
        if(cDaysInUkEl) cDaysInUkEl.textContent = daysIn; if(cUkHalfRuleIndicatorEl) cUkHalfRuleIndicatorEl.className = 'status-indicator';
        if (daysIn <= totalDaysInPeriod - daysOutsideTarget) { if(cUkHalfRuleIndicatorEl) cUkHalfRuleIndicatorEl.classList.add('green'); if(cUkHalfRuleDetailEl) cUkHalfRuleDetailEl.textContent = "Pass: UK days do not exceed allowed limit."; }
        else { if(cUkHalfRuleIndicatorEl) cUkHalfRuleIndicatorEl.classList.add('red'); if(cUkHalfRuleDetailEl) cUkHalfRuleDetailEl.textContent = `Fail: ${daysIn} UK days is too many.`;}

        const ukVisitCheck = checkUKVisitLimit(relevantEntries, UK_VISIT_LIMIT_DAYS); // Uses global
        if(cLongestUkVisitEl) cLongestUkVisitEl.textContent = ukVisitCheck.maxStreak; if(cLongestUkVisitIndicatorEl) cLongestUkVisitIndicatorEl.className = 'status-indicator';
        if (ukVisitCheck.exceedsLimit) { if(cLongestUkVisitIndicatorEl) cLongestUkVisitIndicatorEl.classList.add('red'); if(cLongestUkVisitDetailEl) cLongestUkVisitDetailEl.textContent = `Fail: Longest UK visit of ${ukVisitCheck.maxStreak} days exceeds ${UK_VISIT_LIMIT_DAYS} day limit.`; if(cpStatusTextEl) cpStatusTextEl.textContent = "Non-Compliant"; if(cpStatusIndicatorEl) cpStatusIndicatorEl.className = 'status-indicator red'; }
        else if (ukVisitCheck.maxStreak > UK_VISIT_WARNING_DAYS) { if(cLongestUkVisitIndicatorEl) cLongestUkVisitIndicatorEl.classList.add('yellow'); if(cLongestUkVisitDetailEl) cLongestUkVisitDetailEl.textContent = `Warning: Longest UK visit of ${ukVisitCheck.maxStreak} days (Warning at ${UK_VISIT_WARNING_DAYS}).`; }
        else { if(cLongestUkVisitIndicatorEl) cLongestUkVisitIndicatorEl.classList.add('green'); if(cLongestUkVisitDetailEl) cLongestUkVisitDetailEl.textContent = "Pass: No single UK visit exceeds limit."; }

        const voyageGapCheck = checkVoyageGaps(relevantEntries, VOYAGE_GAP_LIMIT_DAYS); // Uses global
        if(cLongestVoyageGapEl) cLongestVoyageGapEl.textContent = voyageGapCheck.maxGap; if(cLongestVoyageGapIndicatorEl) cLongestVoyageGapIndicatorEl.className = 'status-indicator'; if(cVoyageGapDetailsEl) cVoyageGapDetailsEl.innerHTML = '';
        if (voyageGapCheck.exceedsLimit) {
            if(cLongestVoyageGapIndicatorEl) cLongestVoyageGapIndicatorEl.classList.add('red');
            voyageGapCheck.gaps.forEach(gap => { const li = document.createElement('li'); li.textContent = `Gap of ${gap.gap} days (after ${gap.endDate}, before ${gap.nextStartDate}) exceeds ${VOYAGE_GAP_LIMIT_DAYS} day limit.`; if(cVoyageGapDetailsEl) cVoyageGapDetailsEl.appendChild(li); });
            if (voyageGapCheck.gaps.length === 0 && voyageGapCheck.maxGap > 0) { const li = document.createElement('li'); li.textContent = `A maximum gap of ${voyageGapCheck.maxGap} days was found, exceeding the ${VOYAGE_GAP_LIMIT_DAYS} day limit.`; if(cVoyageGapDetailsEl) cVoyageGapDetailsEl.appendChild(li); }
            if(cpStatusTextEl) cpStatusTextEl.textContent = "Non-Compliant"; if(cpStatusIndicatorEl) cpStatusIndicatorEl.className = 'status-indicator red';
        } else {
            if(cLongestVoyageGapIndicatorEl) cLongestVoyageGapIndicatorEl.classList.add('green'); const li = document.createElement('li'); li.textContent = "Pass: No voyage gaps exceed limit."; if(cVoyageGapDetailsEl) cVoyageGapDetailsEl.appendChild(li);
        }
        if (voyageGapCheck.maxGap === 0 && relevantEntries.filter(e=>e.category === 'work_ship').length < 2 && relevantEntries.filter(e=>e.category === 'work_ship').length > 0 && cVoyageGapDetailsEl) {
            const li = document.createElement('li'); li.textContent = "Not enough voyages in period to calculate gaps."; cVoyageGapDetailsEl.innerHTML = ''; cVoyageGapDetailsEl.appendChild(li);
        }
        if (cpStatusTextEl && cpStatusTextEl.textContent !== "Non-Compliant" && cpStatusTextEl.textContent !== "Invalid Period") { cpStatusTextEl.textContent = "Compliant (Simplified)"; if(cpStatusIndicatorEl) cpStatusIndicatorEl.className = 'status-indicator green'; }
    }
    // Compliance calculation functions (calculateDaysOutsideUK, etc.) are assumed to be defined globally or accessible
    // For this example, they are simplified and assumed to be available from previous steps or defined below.
    // If they were part of a module, they'd be imported.
    // Since this is a single file, they are defined above or will be part of the global scope.
    function isClaimPeriodValid(periodStart, periodEnd, minLengthDays = 365) { /* ... from previous step ... */
        if (!periodStart || !periodEnd) return { isValid: false, reason: "Claim period start or end date not specified." };
        const start = new Date(periodStart); const end = new Date(periodEnd);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) return {isValid: false, reason: "Invalid claim period dates."};
        if (start > end) return { isValid: false, reason: "Claim period start date cannot be after end date." };
        const lengthDays = (end - start) / (1000 * 60 * 60 * 24) + 1;
        if (lengthDays < minLengthDays) return { isValid: false, reason: `Claim period is ${lengthDays} days. Minimum ${minLengthDays} days required.`, currentLength: lengthDays };
        return { isValid: true, reason: "", currentLength: lengthDays };
    }
    function calculateDaysOutsideUK(relevantEntries) { /* ... from previous step ... */
        let count = 0; relevantEntries.forEach(entry => { if (entry.category === 'work_ship') count++; else if (entry.category === 'work_land' && entry.country && !isUK(entry.country)) count++; }); return count;
    }
    function calculateDaysInUK(relevantEntries) { /* ... from previous step ... */
        let count = 0; relevantEntries.forEach(entry => { if (entry.category === 'work_land' && isUK(entry.country)) count++; }); return count;
    }
    function checkUKVisitLimit(relevantEntries, limit) { /* ... from previous step, ensure isUK is accessible ... */
        let currentUKStreak = 0, maxUKStreak = 0;
        const sortedEntries = [...relevantEntries].sort((a, b) => new Date(a.date) - new Date(b.date));
        for (let i = 0; i < sortedEntries.length; i++) {
            const entry = sortedEntries[i]; let dayInUK = (entry.category === 'work_land' && isUK(entry.country));
            if (dayInUK) {
                currentUKStreak++;
                if (i < sortedEntries.length - 1) {
                    const diffDays = (new Date(sortedEntries[i+1].date) - new Date(entry.date)) / (1000 * 60 * 60 * 24);
                    if (diffDays > 1) { maxUKStreak = Math.max(maxUKStreak, currentUKStreak); currentUKStreak = 0; }
                }
            } else { maxUKStreak = Math.max(maxUKStreak, currentUKStreak); currentUKStreak = 0; }
        } maxUKStreak = Math.max(maxUKStreak, currentUKStreak); return { maxStreak: maxUKStreak, exceedsLimit: maxUKStreak > limit };
    }
    function checkVoyageGaps(relevantEntries, limit) { /* ... from previous step ... */
        const workShipEntries = relevantEntries.filter(e => e.category === 'work_ship').sort((a,b) => new Date(a.date) - new Date(b.date));
        if (workShipEntries.length < 2) return { maxGap: 0, exceedsLimit: false, gaps: [] };
        let maxGap = 0; const gaps = [];
        for (let i = 0; i < workShipEntries.length - 1; i++) {
            const gapDays = (new Date(workShipEntries[i+1].date) - new Date(workShipEntries[i].date)) / (1000 * 60 * 60 * 24) - 1;
            if (gapDays > 0) { maxGap = Math.max(maxGap, gapDays); if (gapDays > limit) gaps.push({ gap: gapDays, endDate: workShipEntries[i].date, nextStartDate: workShipEntries[i+1].date });}
        } return { maxGap: maxGap, exceedsLimit: maxGap > limit, gaps: gaps };
    }

    if (analyzeComplianceButton) analyzeComplianceButton.addEventListener('click', runAndDisplayComplianceAnalysis);


    // --- Filtering Logic ---
    if (applyFiltersButton) {
        applyFiltersButton.addEventListener('click', () => {
            currentFilters.dateStart = filterDateStartElement.value;
            currentFilters.dateEnd = filterDateEndElement.value;
            currentFilters.category = filterCategoryElement.value;
            currentFilters.keyword = filterKeywordElement.value;
            renderCalendar(); // Filters now affect calendar directly
            updateDashboard(); // Update dashboard summary based on active filters
        });
    }
    if (resetFiltersButton) {
        resetFiltersButton.addEventListener('click', () => {
            if(filterForm) filterForm.reset();
            currentFilters = { dateStart: '', dateEnd: '', category: '', keyword: '' };
            renderCalendar();
            updateDashboard();
        });
    }

    // --- CSV Export ---
    function escapeCsvCell(cellData) { /* ... from previous ... */
        if (cellData === null || cellData === undefined) return '';
        const stringData = String(cellData);
        if (stringData.includes(',') || stringData.includes('\n') || stringData.includes('"')) return `"${stringData.replace(/"/g, '""')}"`;
        return stringData;
    }
    function exportEntriesToCsv(entriesToExport) { /* ... from previous ... */
        if (!entriesToExport || entriesToExport.length === 0) { alert('No data to export.'); return; }
        const headers = ['ID', 'Date', 'Category', 'Status', 'Ship Name', 'Country', 'Notes'];
        const csvRows = [headers.map(escapeCsvCell).join(',')];
        entriesToExport.forEach(entry => {
            const row = [ escapeCsvCell(entry.id), escapeCsvCell(entry.date), escapeCsvCell(entry.category.replace('_', ' ')), escapeCsvCell(entry.status), escapeCsvCell(entry.shipName), escapeCsvCell(entry.country), escapeCsvCell(entry.notes) ];
            csvRows.push(row.join(','));
        });
        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url); link.setAttribute('download', 'sed_tracker_data.csv');
            link.style.visibility = 'hidden'; document.body.appendChild(link);
            link.click(); document.body.removeChild(link); URL.revokeObjectURL(url);
        } else { alert('CSV export is not supported in your browser.'); }
    }
    if (exportCsvButton) {
        exportCsvButton.addEventListener('click', () => {
            exportEntriesToCsv(localEntriesCache); // Export all cached (fetched) entries
        });
    }

    // --- Initial Load ---
    loadEntries();
});
