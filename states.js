const table = document.getElementById('statesTable');
const scoreTable = document.getElementById('teamScoresTable');

let rawData = [];
let rawHeader = [];
let currentData = [];

fetch('states.csv')
    .then(response => {
        if (!response.ok) throw new Error('Could not load csv file');
        return response.text();
    })
    .then(csvText => {
        const results = Papa.parse(csvText, { header: true });
        rawData = results.data;

        rawHeader = Object.keys(rawData[0]);

        const rows = rawData.map(obj => rawHeader.map(h => obj[h]));
        rawData = rows;

        currentData = sortByTotalTime([rawHeader, ...rawData]).slice(1); // skip header
        const finalData = addPointsColumn([rawHeader, ...currentData]);

        generateTable(finalData);
        generateScoreTable(calculateTeamScores(finalData));
    })
    .catch(error => {
        table.innerHTML = `<tr><td colspan="5">Error loading data: ${error.message}</td></tr>`;
    });

function generateTable(data) {
    table.innerHTML = '';

    const headerRow = table.insertRow();
    data[0].forEach(headerText => {
        const th = document.createElement('th');
        th.textContent = headerText;
        headerRow.appendChild(th);
    });

    const thArrow = document.createElement('th');
    thArrow.textContent = "Move";
    headerRow.appendChild(thArrow);

    for (let i = 1; i < data.length; i++) {
        const row = table.insertRow();
        data[i].forEach(cellText => {
            const cell = row.insertCell();
            row.classList.add(`team-${slugifyTeamName(data[i][2])}`);
            cell.textContent = cellText;
        });

        const arrowCell = row.insertCell();

        arrowCell.innerHTML = `
            <button class="move-up" data-index="${i}" title="Move Up">
                <i class="fas fa-arrow-up"></i>
            </button>
            <button class="move-down" data-index="${i}" title="Move Down">
                <i class="fas fa-arrow-down"></i>
            </button>
        `;
        arrowCell.querySelector(".move-up").addEventListener("click", moveRunnerUp);
        arrowCell.querySelector(".move-down").addEventListener("click", moveRunnerDown);
    }
}

function sortByTotalTime(data){
    const header = data[0];
    const rows = data.slice(1);

    rows.sort((a, b) => {
        const durA = convertMsToSeconds(a[2]);
        const durB = convertMsToSeconds(b[2]);
        return durA - durB;
    });
    return [header, ...rows];
}

function addPointsColumn(data){
    const header = [...data[0]];
    header.unshift("Place");
    const rows = data.slice(1).map((row, index) => {
        const newRow = [...row];
        newRow.unshift((index + 1).toString());
        return newRow;
    });
    return [header, ...rows];
}

function convertMsToSeconds(hmsString) {
    if (!hmsString) return 0;
    const parts = hmsString.split(':');
    let totalSeconds = 0;
    if (parts.length === 2) { // mm:ss
        totalSeconds = (+parts[0]) * 60 + (+parts[1]);
    } else if (parts.length === 3) { // hh:mm:ss
        totalSeconds = (+parts[0]) * 3600 + (+parts[1]) * 60 + (+parts[2]);
    }
    return totalSeconds;
}

function calculateTeamScores(data){
    const teamScores = {};
    const rows = data.slice(1);
    rows.forEach(row => {
        const team = row[2];
        const points = Number(row[0]);
        if (!teamScores[team]) teamScores[team] = [];
        if (teamScores[team].length < 5) teamScores[team].push(points);
    });

    const teamTotals = Object.entries(teamScores).map(([team, points]) => {
        const total = points.reduce((sum, p) => sum + p, 0);
        return { team, total, runners: points };
    });
    teamTotals.sort((a, b) => a.total - b.total);

    return teamTotals;
}

function generateScoreTable(data){
    scoreTable.innerHTML = '';
    const headerRow = scoreTable.insertRow();
    const headers = ['Place', 'Team', 'Total Points', 'Individual Points'];
    headers.forEach(headerText => {
        const th = document.createElement('th');
        th.textContent = headerText;
        headerRow.appendChild(th);
    });

    data.forEach((teamData, index) => {
        const row = scoreTable.insertRow();

        const placeCell = row.insertCell();
        placeCell.textContent = index + 1;

        const teamCell = row.insertCell();
        teamCell.textContent = teamData.team;

        const totalCell = row.insertCell();
        totalCell.textContent = teamData.total;

        const runnersCell = row.insertCell();
        runnersCell.textContent = teamData.runners.join(', ');
    });

    for (let i = 1; i < scoreTable.rows.length; i++) {
        const teamName = scoreTable.rows[i].cells[1].textContent;
        scoreTable.rows[i].classList.add(`team-${slugifyTeamName(teamName)}`);
    }
}

function slugifyTeamName(name) {
    return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

function moveRunnerUp(e) {
    const i = Number(e.currentTarget.dataset.index) - 1;
    if (i <= 0) return;
    [currentData[i], currentData[i - 1]] = [currentData[i - 1], currentData[i]];
    reScore();
}

function moveRunnerDown(e) {
    const i = Number(e.currentTarget.dataset.index) - 1;
    if (i >= currentData.length - 1) return;
    [currentData[i], currentData[i + 1]] = [currentData[i + 1], currentData[i]];
    reScore();
}

function reScore() {
    const finalData = addPointsColumn([rawHeader, ...currentData]);
    generateTable(finalData);
    generateScoreTable(calculateTeamScores(finalData));
}
