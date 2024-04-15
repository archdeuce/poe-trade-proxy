const morgan = require('morgan');
const express = require('express');

const bodyParser = require('body-parser');
const app = express();

app.use(morgan('dev'));
app.use(
  bodyParser.urlencoded({
    extended: true,
  }),
);
app.use(bodyParser.json());

app.get('/', (_, response) => {
  response.status(200).send('poe trade proxy works');
});

app.post('/trade', async (request, response) => {
  if (!request.body) return response.sendStatus(400);
  const { league = 'Necropolis', offset = 0, limit = 10 } = request.body;

  try {
    const config = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json;charset=utf-8',
      },
      body: JSON.stringify(request.body),
    };

    const firstRequest = await fetch(
      `https://www.pathofexile.com/api/trade/search/${league}`,
      config,
    );
    const firstResponse = await firstRequest.json();
    const resultLines = firstResponse.result.slice(offset, limit).join();
    const { id: queryId } = firstResponse;

    const secondRequest = await fetch(
      `https://www.pathofexile.com/api/trade/fetch/${resultLines}?query=${queryId}`,
    );
    const secondResponse = await secondRequest.json();

    response.setHeader('Content-Type', 'application/json');
    response.send(secondResponse).status(200);
  } catch (error) {
    response.status(503).send({ error: true, message: 'Server error' });
  }
});

app.get('*', (_, response) => {
  response.status(404).send('wrong path');
});

const PORT = process.env.port || 4000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}...`);
});
