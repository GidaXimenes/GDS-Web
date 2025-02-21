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
    helpers: require(`${__dirname}/views/helpers/helpers`),
  }),
);
app.set('view engine', 'handlebars');
app.set('views', `${__dirname}/views`);

app.use(
  session({
    secret: 'iD#ndGinmNasl@e',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 1000 * 60 * 60 }, // Sessão dura 1 hora
  }),
);

app.use(express.urlencoded({ extended: false }));

app.use(express.static(`${__dirname}/public`));

app.use(router);
app.listen(PORT, () => {
  console.log(`Express app iniciada na porta ${PORT}.`);
});
