const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { OpenAI } = require('openai');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.get('/healthz', (req, res) => res.status(200).send('Server is healthy!'));

app.post('/api/chat', async (req, res) => {
    const { message } = req.body;
    const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: message }],
    });
    res.json({ reply: completion.choices[0].message.content });
});

app.post('/api/sheets', async (req, res) => {
    const { title, category, content } = req.body;
    const serviceAccountAuth = new JWT({
        email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, serviceAccountAuth);
    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[0];
    await sheet.addRow({ 'العنوان': title, 'القسم': category, 'المحتوى': content, 'التاريخ': new Date().toLocaleString('ar-EG') });
    res.json({ success: true });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
