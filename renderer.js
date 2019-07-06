var handler = require('./handler');

const bottom = `
    <table>
        <th>No.</th>
        <th>Full URL</th>
        <th>Shortened URL</th>
        <th>Hits</th>
        ${renderRecentUrlTableRow(url)}
    </table>
`

function renderRecentUrlTableRow(url) {
    return `
        ${url.map(url => `
        <tr>
        <td>${url.id}</td>
        <td>${url.fullUrl}</td>
        <td><a href="${url.shortUrl}" onclick="${handler.addHits(url.shortUrl)}">${url.shortUrl}</a></td>
        <td>${url.hits}</td>
        </tr>
        `)}
    `;
}