// Simple test structures - not using a specific framework here for environment simplicity
// To run these, you'd typically use a test runner like Jest or Mocha.

// Mocking DOM elements that are updated by some functions, if necessary for those tests.
// For pure calculation functions, this is not needed.

// --- Helper Functions (mirroring from app.js for testability) ---
const UK_ALIASES_TEST = ['uk', 'united kingdom', 'gb', 'great britain', 'england', 'scotland', 'wales', 'northern ireland'];
function isUKTest(countryName) {
    if (!countryName) return false;
    return UK_ALIASES_TEST.includes(countryName.toLowerCase().trim());
}

function getEntriesForPeriodTest(allEntries, periodStart, periodEnd, status = "confirmed") {
    const start = new Date(periodStart);
    const end = new Date(periodEnd);
    return allEntries.filter(entry => {
        const entryDate = new Date(entry.date);
        return entry.status === status && entryDate >= start && entryDate <= end;
    });
}

// --- Compliance Functions (mirroring relevant logic from app.js for testability) ---
// calculateDaysOutsideUK, calculateDaysInUK, checkUKVisitLimit, checkVoyageGaps, isClaimPeriodValid
// These would be imported if app.js was structured as a module. For now, re-define simplified versions or core logic.

function calculateDaysOutsideUKTest(relevantEntries) {
    let count = 0;
    relevantEntries.forEach(entry => {
        if (entry.category === 'work_ship') {
            count++;
        } else if (entry.category === 'work_land' && entry.country && !isUKTest(entry.country)) {
            count++;
        }
    });
    return count;
}

function calculateDaysInUKTest(relevantEntries) {
    let count = 0;
    relevantEntries.forEach(entry => {
        if (entry.category === 'work_land' && isUKTest(entry.country)) {
            count++;
        }
    });
    return count;
}

function checkUKVisitLimitTest(relevantEntries, limit) {
    let currentUKStreak = 0;
    let maxUKStreak = 0;
    const sortedEntries = [...relevantEntries].sort((a, b) => new Date(a.date) - new Date(b.date));
    for (let i = 0; i < sortedEntries.length; i++) {
        const entry = sortedEntries[i];
        let dayInUK = (entry.category === 'work_land' && isUKTest(entry.country));
        if (dayInUK) {
            currentUKStreak++;
            if (i < sortedEntries.length - 1) {
                const nextEntryDate = new Date(sortedEntries[i+1].date);
                const currentEntryDate = new Date(entry.date);
                const diffDays = (nextEntryDate - currentEntryDate) / (1000 * 60 * 60 * 24);
                if (diffDays > 1) {
                    maxUKStreak = Math.max(maxUKStreak, currentUKStreak);
                    currentUKStreak = 0;
                }
            }
        } else {
            maxUKStreak = Math.max(maxUKStreak, currentUKStreak);
            currentUKStreak = 0;
        }
    }
    maxUKStreak = Math.max(maxUKStreak, currentUKStreak);
    return { maxStreak: maxUKStreak, exceedsLimit: maxUKStreak > limit };
}

function checkVoyageGapsTest(relevantEntries, limit) {
    const workShipEntries = relevantEntries
        .filter(entry => entry.category === 'work_ship')
        .sort((a,b) => new Date(a.date) - new Date(b.date));
    if (workShipEntries.length < 2) return { maxGap: 0, exceedsLimit: false, gaps: [] };
    let maxGap = 0;
    const gaps = [];
    for (let i = 0; i < workShipEntries.length - 1; i++) {
        const voyageEndDate = new Date(workShipEntries[i].date);
        const nextVoyageStartDate = new Date(workShipEntries[i+1].date);
        const gapDays = (nextVoyageStartDate - voyageEndDate) / (1000 * 60 * 60 * 24) - 1;
        if (gapDays > 0) {
           maxGap = Math.max(maxGap, gapDays);
           if (gapDays > limit) gaps.push({ gap: gapDays, endDate: workShipEntries[i].date, nextStartDate: workShipEntries[i+1].date });
        }
    }
    return { maxGap: maxGap, exceedsLimit: maxGap > limit, gaps: gaps };
}

function isClaimPeriodValidTest(periodStart, periodEnd, minLengthDays = 365) {
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


// --- Test Suites ---
console.log("Running Compliance Logic Tests...");

// isUK Tests
console.log("\n--- isUK ---");
console.assert(isUKTest('UK') === true, "Test Case 1 Failed: UK");
console.assert(isUKTest('United Kingdom') === true, "Test Case 2 Failed: United Kingdom");
console.assert(isUKTest('France') === false, "Test Case 3 Failed: France");
console.assert(isUKTest('gb') === true, "Test Case 4 Failed: gb");
console.assert(isUKTest('') === false, "Test Case 5 Failed: Empty string");
console.assert(isUKTest(null) === false, "Test Case 6 Failed: Null");
console.assert(isUKTest(' U.K. ') === false, "Test Case 7 Failed: U.K. with periods (not in alias)"); // Depends on strictness
console.assert(isUKTest('uk ') === true, "Test Case 8 Failed: Trailing space");


// Mock Entries Data
const mockEntries = [
    { id: '1', date: '2023-01-01', category: 'work_ship', status: 'confirmed', shipName: 'Vessel A' },
    { id: '2', date: '2023-01-02', category: 'work_land', status: 'confirmed', country: 'France' },
    { id: '3', date: '2023-01-03', category: 'work_land', status: 'confirmed', country: 'UK' },
    { id: '4', date: '2023-01-04', category: 'vacation', status: 'confirmed' }, // No country, won't count for in/out UK
    { id: '5', date: '2023-01-05', category: 'travel', status: 'pending' }, // Pending, should be ignored
    { id: '6', date: '2023-03-01', category: 'work_ship', status: 'confirmed', shipName: 'Vessel B' },
    { id: '7', date: '2023-03-02', category: 'work_land', status: 'confirmed', country: 'Germany' },
    { id: '8', date: '2023-03-03', category: 'work_land', status: 'confirmed', country: 'United Kingdom' },
    { id: '9', date: '2023-01-10', category: 'work_land', status: 'confirmed', country: 'UK' }, // For UK streak
    { id: '10', date: '2023-01-11', category: 'work_land', status: 'confirmed', country: 'UK' },// For UK streak
    { id: '11', date: '2023-01-12', category: 'work_land', status: 'confirmed', country: 'France' }, // Breaks UK streak
    { id: '12', date: '2023-01-13', category: 'work_land', status: 'confirmed', country: 'UK' }, // New UK streak
    { id: '13', date: '2023-06-01', category: 'work_ship', status: 'confirmed', shipName: 'Vessel C' }, // For voyage gap
];

// getEntriesForPeriod Tests
console.log("\n--- getEntriesForPeriod ---");
const periodEntries = getEntriesForPeriodTest(mockEntries, '2023-01-01', '2023-01-31');
console.assert(periodEntries.length === 5, `Test Case 9 Failed: Expected 5 entries, got ${periodEntries.length}`); // 1,2,3,4,9,10,11,12 -> 4 confirmed in Jan + 1 pending
const confirmedPeriodEntries = getEntriesForPeriodTest(mockEntries, '2023-01-01', '2023-01-31', "confirmed");
console.assert(confirmedPeriodEntries.filter(e=>e.status === 'confirmed').length === 4, `Test Case 10 Failed: Expected 4 confirmed entries in Jan, got ${confirmedPeriodEntries.length}`); // 1,2,3,4,9,10,11,12 (all confirmed in mock) -> 1,2,3,4,9,10,11,12 -> 8 if all are in Jan. Let's check dates.
// Correcting mock entries for dates to make tests clearer
const mockEntriesForPeriodTest = [
    { id: 'p1', date: '2023-01-01', category: 'work_ship', status: 'confirmed'},
    { id: 'p2', date: '2023-01-15', category: 'work_land', status: 'confirmed', country: 'France' },
    { id: 'p3', date: '2023-01-31', category: 'work_land', status: 'confirmed', country: 'UK' },
    { id: 'p4', date: '2023-02-01', category: 'work_ship', status: 'confirmed'}, // Outside period
    { id: 'p5', date: '2023-01-10', category: 'travel', status: 'pending' }, // Pending
];
const janEntries = getEntriesForPeriodTest(mockEntriesForPeriodTest, '2023-01-01', '2023-01-31', "confirmed");
console.assert(janEntries.length === 3, `Test Case 11 Failed: getEntriesForPeriod. Expected 3, Got ${janEntries.length}`);

// calculateDaysOutsideUK Tests
console.log("\n--- calculateDaysOutsideUK ---");
const relevantForCalc = getEntriesForPeriodTest(mockEntries, '2023-01-01', '2023-03-31', "confirmed");
console.assert(calculateDaysOutsideUKTest(relevantForCalc.filter(e=>e.date < '2023-02-01')) === 2, "Test Case 12 Failed: Days outside UK Jan. Expected 2 (ship, france)."); // Entry 1 (ship), 2 (France)
console.assert(calculateDaysOutsideUKTest(relevantForCalc) === 4, "Test Case 13 Failed: Days outside UK total. Expected 4 (ship, france, ship, germany)."); // 1,2,6,7

// calculateDaysInUK Tests
console.log("\n--- calculateDaysInUK ---");
console.assert(calculateDaysInUKTest(relevantForCalc.filter(e=>e.date < '2023-02-01')) === 3, "Test Case 14 Failed: Days in UK Jan. Expected 3 (UK, UK, UK)."); // Entry 3, 9, 10
console.assert(calculateDaysInUKTest(relevantForCalc) === 4, "Test Case 15 Failed: Days in UK total. Expected 4 (3,8,9,10)."); // 3, 8, 9, 10

// checkUKVisitLimit Tests
console.log("\n--- checkUKVisitLimit ---");
const ukStreakEntries = [
    { date: '2023-01-01', category: 'work_land', country: 'UK', status: 'confirmed' },
    { date: '2023-01-02', category: 'work_land', country: 'UK', status: 'confirmed' },
    { date: '2023-01-03', category: 'work_land', country: 'France', status: 'confirmed' }, // Breaks streak
    { date: '2023-01-04', category: 'work_land', country: 'UK', status: 'confirmed' },
    { date: '2023-01-05', category: 'work_land', country: 'UK', status: 'confirmed' },
    { date: '2023-01-06', category: 'work_land', country: 'UK', status: 'confirmed' }, // Streak of 3
];
console.assert(checkUKVisitLimitTest(ukStreakEntries, 2).maxStreak === 3, `Test Case 16 Failed: UK Visit Max Streak. Expected 3, Got ${checkUKVisitLimitTest(ukStreakEntries, 2).maxStreak}`);
console.assert(checkUKVisitLimitTest(ukStreakEntries, 2).exceedsLimit === true, "Test Case 17 Failed: UK Visit Exceeds Limit True");
console.assert(checkUKVisitLimitTest(ukStreakEntries, 3).exceedsLimit === false, "Test Case 18 Failed: UK Visit Exceeds Limit False");
const ukStreakWithGap = [
    { date: '2023-01-01', category: 'work_land', country: 'UK', status: 'confirmed' },
    { date: '2023-01-02', category: 'work_land', country: 'UK', status: 'confirmed' }, // Streak 2
    { date: '2023-01-05', category: 'work_land', country: 'UK', status: 'confirmed' }, // New streak 1 (gap breaks it)
];
console.assert(checkUKVisitLimitTest(ukStreakWithGap, 1).maxStreak === 2, `Test Case 19 Failed: UK Visit with date gap. Expected 2, Got ${checkUKVisitLimitTest(ukStreakWithGap,1).maxStreak}`);


// checkVoyageGaps Tests
console.log("\n--- checkVoyageGaps ---");
const voyageEntries = [
    { date: '2023-01-01', category: 'work_ship', status: 'confirmed' }, // Voyage 1 end
    { date: '2023-01-02', category: 'travel', status: 'confirmed' },    // Day 1 of gap
    { date: '2023-01-03', category: 'vacation', status: 'confirmed' },  // Day 2 of gap
    { date: '2023-01-04', category: 'work_ship', status: 'confirmed' }, // Voyage 2 start (Gap = 2 days)
    { date: '2023-01-10', category: 'work_ship', status: 'confirmed' }, // Voyage 3 start (Gap = 5 days after 01-04)
];
console.assert(checkVoyageGapsTest(voyageEntries, 3).maxGap === 5, `Test Case 20 Failed: Voyage Gap Max. Expected 5, Got ${checkVoyageGapsTest(voyageEntries, 3).maxGap}`);
console.assert(checkVoyageGapsTest(voyageEntries, 3).exceedsLimit === true, "Test Case 21 Failed: Voyage Gap Exceeds True");
console.assert(checkVoyageGapsTest(voyageEntries, 5).exceedsLimit === false, "Test Case 22 Failed: Voyage Gap Exceeds False");
console.assert(checkVoyageGapsTest(voyageEntries, 1).gaps.length === 2, `Test Case 23 Failed: Voyage Gap Count. Expected 2, Got ${checkVoyageGapsTest(voyageEntries, 1).gaps.length}`);


// isClaimPeriodValid Tests
console.log("\n--- isClaimPeriodValid ---");
console.assert(isClaimPeriodValidTest('2023-01-01', '2023-12-31', 365).isValid === true, "Test Case 24 Failed: Valid 365 day period.");
console.assert(isClaimPeriodValidTest('2023-01-01', '2023-12-30', 365).isValid === false, "Test Case 25 Failed: Invalid short period.");
console.assert(isClaimPeriodValidTest('2023-01-01', '2023-01-01', 1).isValid === true, "Test Case 26 Failed: Valid 1 day period.");
console.assert(isClaimPeriodValidTest('2023-02-01', '2023-01-01', 365).isValid === false, "Test Case 27 Failed: Start after end.");
console.assert(isClaimPeriodValidTest(null, '2023-01-01', 365).isValid === false, "Test Case 28 Failed: Null start.");

console.log("\nAll console assertion tests complete. Check console for failures.");
// End of tests/compliance.test.js
