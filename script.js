const table = document.getElementById('leagueMeetTable');
const scoreTable = document.getElementById('teamScoresTable');
let rawData = [];
const courseDistances = {
    McClennan: 3.1,
    Winchester: 3.08,
    Wilmington: 3.1,
    Twilight: 3.06,
    Baystate: 3.1,
    Burlington: 3.05,
    Stoneham: 3.1,
    Watertown: 3.1,
    Lexington: 3.1,
    Devens: 3.1,
    Melrose: 3.1,
    Reading: 3.1,
    Belmont: 3,
    Woburn: 3,
    "Catholic Memorial": 3.1

};

fetch('league-meet.csv')
    .then(response => {
        if (!response.ok) {
            throw new Error('Could not load csv file');
        }
        return response.text();
    })
    .then(csvText => {
        const results = Papa.parse(csvText, { header: false });
        rawData = results.data;
        const dataWithPace = addPaceColumn(rawData);
        const sortedData = sortByPace(dataWithPace);
        const finalData = addPointsColumn(sortedData);
        generateTable(finalData);
        generateScoreTable(calculateTeamScores(finalData));
        generateCourseDistanceForms();
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

    for (let i = 1; i < data.length; i++) {
        const row = table.insertRow();
        data[i].forEach(cellText => {
        const cell = row.insertCell();
        row.classList.add(`team-${data[i][4].toLowerCase()}`);
        cell.textContent = cellText;
        });
    }
}
function sortByTotalTime(data){
    const header = data[0];
    const rows = data.slice(1);

    rows.sort((a, b) => {
        const durA = convertHmsToSeconds(a[1]);
        const durB = convertHmsToSeconds(b[1]);
        return durA - durB;
    });
    return [header, ...rows];
}

function sortByPace(data){
    const header = data[0];
    const rows = data.slice(1);

    rows.sort((a, b) => {
        const durA = convertHmsToSeconds(a[2]);
        const durB = convertHmsToSeconds(b[2]);
        return durA - durB;
    });
    return [header, ...rows];
}

function addPaceColumn(data){

    const header =[...data[0]];
    header.splice(2, 0, 'Pace (min/mile)');
    const rows = data.slice(1).map(row => {
        const timeInSeconds = convertHmsToSeconds(row[1]);
        const courseDistance = courseDistances[row[3]];
        const paceInSecondsPerMile = timeInSeconds / courseDistance;
        const formatedPace = convertSecondsToPace(paceInSecondsPerMile);
        const newRow = [...row];
        newRow.splice(2, 0, formatedPace);
        return newRow;
        
    });
    return [header, ...rows];
}

function addPointsColumn(data){
    const header =[...data[0]];
    header.unshift("Place")
    const rows = data.slice(1).map((row, index) => {
        const newRow = [...row];
        newRow.unshift((index + 1).toString());
        return newRow;
        
    });
    return [header, ...rows];
}

function convertHmsToSeconds(hmsString) {
    const [hours, minutes, seconds] = hmsString.split(':');
    const totalSeconds = (+hours) * 3600 + (+minutes) * 60 + (+seconds);
    return totalSeconds;
}

function convertSecondsToPace(seconds) {
    let minutes = Math.floor(seconds / 60);
    let secs = Math.round(seconds % 60);

    if (secs === 60) {
        minutes += 1;
        secs = 0;
    }
    if (minutes >= 10){
        return `00:${minutes}:${secs.toString().padStart(2, '0')}`;
    }
    return `00:0${minutes}:${secs.toString().padStart(2, '0')}`;
}

function calculateTeamScores(data){
    const teamScores = {};
    const rows = data.slice(1);
    rows.forEach((row, index) => {
        const team = row[4];
        const points = Number(row[0]);
        if (!teamScores[team]) {
            teamScores[team] = [];
        }
        if (teamScores[team].length < 5){
            teamScores[team].push(points);
        }
    });
    const teamTotals = Object.entries(teamScores).map(([team, points]) => {
        const total = points.reduce((sum, p) => sum + p, 0);
        return { team, total, runners:points };
    });
    teamTotals.sort((a, b) => a.total - b.total);

    return teamTotals;
}

function generateScoreTable(data){
    scoreTable.innerHTML = '';
    const headerRow = scoreTable.insertRow();
    data.header = ['Team', 'Total Points', 'Individual Points'];
    data.header.forEach(headerText => {
        const th = document.createElement('th');
        th.textContent = headerText;
        headerRow.appendChild(th);
    });

    data.forEach(teamData => {
        const row = scoreTable.insertRow();
        const teamCell = row.insertCell();
        teamCell.textContent = teamData.team;

        const totalCell = row.insertCell();
        totalCell.textContent = teamData.total;

        const runnersCell = row.insertCell();
        runnersCell.textContent = teamData.runners.join(', ');
    });
    //change color based on team
    for (let i = 1; i < scoreTable.rows.length; i++) {
        const teamName = scoreTable.rows[i].cells[0].textContent;
        scoreTable.rows[i].classList.add(`team-${teamName.toLowerCase()}`);
    }
}

function generateCourseDistanceForms(){
    const container = document.getElementById('courseFormsContainer');
    container.innerHTML = '';
    const sortedCourses = Object.keys(courseDistances).sort();
    sortedCourses.forEach(course => {
        const formDiv = document.createElement('div');
        formDiv.classList.add('input-group', 'mb-2');
        formDiv.innerHTML = `
            <span class="input-group-text">${course}</span>
            <input type="number" step="0.01" min = "0.1" class="form-control" id="distance-${course}" value="${courseDistances[course]}">
        `;
        container.appendChild(formDiv);
    });

    sortedCourses.forEach(course => {
        const input = document.getElementById(`distance-${course}`);
        input.addEventListener('input', (e) => {
            const input = document.getElementById(`distance-${course}`);
            const newDistance = parseFloat(input.value);
            
            courseDistances[course] = newDistance;
            const updatedPaceData = addPaceColumn(rawData)
            const sortedData = sortByPace(updatedPaceData);
            const finalData = addPointsColumn(sortedData);
            generateTable(finalData);
            generateScoreTable(calculateTeamScores(finalData));
        });
    });
}