const table = document.getElementById('leagueMeetTable');
fetch('league-meet.csv')
    .then(response => {
        if (!response.ok) {
            throw new Error('Could not load csv file');
        }
        return response.text();
    })
    .then(csvText => {
        const results = Papa.parse(csvText, { header: false });
        const data = results.data;
        const sortedData = sortByTotalTime(data);
        console.log(sortedData);
        generateTable(sortedData);
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
        console.log(durA, durB);
        return durA - durB;
    });
    console.log([header, ...rows]);
    return [header, ...rows];
}
function convertHmsToSeconds(hmsString) {
    const [hours, minutes, seconds] = hmsString.split(':');
    const totalSeconds = (+hours) * 3600 + (+minutes) * 60 + (+seconds);
    return totalSeconds;
  }