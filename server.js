const path = require('path');
const express = require('express');

const app = express();
const port = process.env.PORT || 3000;
const staticPath = path.join(__dirname, './', 'build');

app.use(express.static(staticPath));

// Incase user requests a resource not in the public folder
app.get('*', (req, res) => {
  res.sendFile(path.join(staticPath, 'index.html'));
});

app.listen(port, () => {
   console.log(`Server listening on port ${port}`);
});
