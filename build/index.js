"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router_1 = __importDefault(require("./router/router"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_handlebars_1 = require("express-handlebars");
const express_session_1 = __importDefault(require("express-session"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3333;
app.use((0, morgan_1.default)('short'));
app.engine('handlebars', (0, express_handlebars_1.engine)({
    layoutsDir: `${__dirname}/views/layouts`,
    defaultLayout: 'main',
    partialsDir: `${__dirname}/views/partials`,
}));
app.set('view engine', 'handlebars');
app.set('views', `${__dirname}/views`);
app.use((0, express_session_1.default)({
    secret: 'iD#ndGinmNasl@e', // Substitua por uma chave segura
    resave: true,
    saveUninitialized: true,
}));
app.use(express_1.default.urlencoded({ extended: false }));
app.use(router_1.default);
app.listen(PORT, () => {
    console.log(`Express app iniciada na porta ${PORT}.`);
});
