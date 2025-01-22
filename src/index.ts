import express, { Request, Response } from 'express';
import router from './router/router';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { engine } from 'express-handlebars';
import session from 'express-session';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3333;
app.use(morgan('short'));

app.engine(
  'handlebars',
  engine({
    layoutsDir: `${__dirname}/views/layouts`,
    defaultLayout: 'main',
    partialsDir: `${__dirname}/views/partials`,
  }),
);
app.set('view engine', 'handlebars');
app.set('views', `${__dirname}/views`);

app.use(
  session({
    secret: 'iD#ndGinmNasl@e', // Substitua por uma chave segura
    resave: true,
    saveUninitialized: true,
  }),
);

app.use(express.urlencoded({ extended: false }));

app.use(router);
app.listen(PORT, () => {
  console.log(`Express app iniciada na porta ${PORT}.`);
});
