require ('dotenv').config();
const path = require("node:path");
const express = require('express');
const app = express();
const port = 3000;
const { getUiData, getApiData } = require('./api'); // Adjust the path as necessary

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
})
app.get('/ui', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'indexui.html'));
})

app.get('/api-ui', async (req, res) => {
    try {
        const data = await getUiData();
        res.json(data);
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ error: 'Failed to fetch data' });
    }
});
app.get('/api-rest', async (req, res) => {
    try {
        const data = await getApiData();
        res.json(data);
    } catch (error) {
        console.error('Error fetching API data:', error);
        res.status(500).json({ error: 'Failed to fetch API data' });
    }
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});