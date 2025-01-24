"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const geminiService_1 = __importDefault(require("../services/geminiService"));
const prompt_1 = __importDefault(require("../prompts/prompt"));
const marked_1 = require("marked");
const index = (req, res) => {
    res.render('main/index');
};
const story_gen = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const session = req.session;
        if (!session.form1 && !session.quickForm) {
            res
                .status(400)
                .send('Formulários incompletos. Por favor, preencha os formulários primeiro.');
        }
        let prompt = '';
        let data;
        if (session.quickForm) {
            // Caso o usuário tenha escolhido a versão rápida
            prompt = yield prompt_1.default.quickPrompt(session.quickForm);
            data = session.quickForm;
        }
        else if (session.form1 && session.form2) {
            // Caso o usuário tenha escolhido a versão completa
            prompt = yield prompt_1.default.completePrompt(session.form1, session.form2);
            data = { form1: session.form1, form2: session.form2 };
        }
        else {
            // Caso nenhum formulário tenha sido respondido
            res.status(400).send('Dados incompletos para gerar a narrativa.');
        }
        // Chame a API Gemini para gerar a narrativa
        const narrativeMarkdown = yield (0, geminiService_1.default)(prompt);
        // Converta o Markdown para HTML
        const narrativeHTML = (0, marked_1.marked)(narrativeMarkdown);
        // Renderize o story.handlebars com a narrativa gerada
        res.render('main/story', {
            data,
            narrative: narrativeHTML,
        });
    }
    catch (error) {
        console.error('Erro ao gerar a narrativa:', error);
        res.status(500).send('Erro ao gerar a narrativa.');
    }
});
const form1 = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (req.method === 'GET') {
        res.render('forms/completeForm1');
    }
    else {
        try {
            const session = req.session;
            session.form1 = req.body;
            session.form2Data = [];
            session.remainingMissions = parseInt(req.body.quantidadeMissoes, 10);
            res.redirect('/forms/completeForm2');
        }
        catch (err) {
            res.status(500).send(err);
        }
    }
});
const form2 = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (req.method === 'GET') {
        const session = req.session;
        if (session.remainingMissions > 0) {
            res.render('forms/completeForm2');
        }
        else {
            res.status(400).send('Quantidade de missões inválida');
        }
    }
    else {
        try {
            const session = req.session;
            session.form2Data.push(req.body);
            session.remainingMissions -= 1;
            if (session.remainingMissions > 0) {
                res.redirect('/forms/completeForm2');
            }
            else {
                session.form2 = session.form2Data;
                res.redirect('/main/story');
            }
        }
        catch (err) {
            res.status(500).send(err);
        }
    }
});
const quickForm = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (req.method === 'GET') {
        res.render('forms/quickForm');
    }
    else {
        try {
            const session = req.session;
            session.quickForm = req.body;
            res.redirect('/main/story');
        }
        catch (err) {
            res.status(500).send(err);
        }
    }
});
exports.default = { index, story_gen, form1, form2, quickForm };
