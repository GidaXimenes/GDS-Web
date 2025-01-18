import express, { Request, Response } from 'express';
import router from './router/router';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { engine } from 'express-handlebars';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3333;
app.use(morgan('short'));

app.engine(
  'handlebars',
  engine({
    layoutsDir: `${__dirname}/views/layout`,
    defaultLayout: 'main',
    partialsDir: `${__dirname}/views/partials`,
  }),
);
app.set('view engine', 'handlebars');
app.set('views', `${__dirname}/views`);

app.use(router);
app.listen(PORT, () => {
  console.log('Express app iniciada na porta 3333.');
});
