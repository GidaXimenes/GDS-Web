"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
// Import normal do pdfmake
const pdfmake_1 = __importDefault(require("pdfmake/build/pdfmake"));
// Import do vfs_fonts como "qualquer coisa"
const pdfFonts = __importStar(require("pdfmake/build/vfs_fonts"));
//console.log('pdfFonts ->', pdfFonts);
// Basta usar a "default" diretamente como vfs
pdfmake_1.default.vfs = pdfFonts.default;
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
            return;
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
            res.status(400).send('Dados incompletos para gerar a narrativa.');
            return;
        }
        // Chame a API Gemini para gerar a narrativa
        const narrativeMarkdown = yield (0, geminiService_1.default)(prompt);
        // Converta o Markdown para HTML
        const narrativeHTML = (0, marked_1.marked)(narrativeMarkdown);
        // Gere o prompt para as instruções do slide
        const slidePrompt = yield prompt_1.default.slidePrompt(narrativeMarkdown);
        // Chame a API Gemini novamente para gerar as instruções
        const slideInstructionsMarkdown = yield (0, geminiService_1.default)(slidePrompt);
        // Converta as instruções de Markdown para HTML
        const slideInstructionsHTML = (0, marked_1.marked)(slideInstructionsMarkdown);
        // Salve a narrativa e as instruções na sessão
        session.narrative = narrativeMarkdown; // Salve em Markdown para o PDF
        session.instructions = slideInstructionsMarkdown; // Salve em Markdown para o PDF
        // Renderize o story.handlebars com a narrativa e as instruções
        res.render('main/story', {
            data,
            narrative: narrativeHTML,
            instructions: slideInstructionsHTML,
        });
    }
    catch (error) {
        console.error('Erro ao gerar a narrativa ou as instruções:', error);
        res.status(500).send('Erro ao gerar a narrativa ou as instruções.');
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
const generatePDF = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const session = req.session;
        if (!session.narrative || !session.instructions) {
            res.status(400).send('Dados para gerar o PDF estão incompletos.');
        }
        const { narrative, instructions } = session;
        // Montamos o docDefinition sem nos preocuparmos com a tipagem exata:
        const docDefinition = {
            pageSize: 'A4',
            pageMargins: [40, 60, 40, 60],
            content: [
                { text: 'Minha Narrativa', style: 'header' },
                {
                    text: narrative,
                    margin: [0, 10, 0, 10],
                },
                { text: 'Minhas Instruções', style: 'subheader' },
                {
                    text: instructions,
                },
            ],
            styles: {
                header: {
                    fontSize: 18,
                    bold: true,
                },
                subheader: {
                    fontSize: 14,
                    bold: true,
                },
            },
        };
        // Cria o PDF
        const pdfDocGenerator = pdfmake_1.default.createPdf(docDefinition);
        // Retorna em buffer
        pdfDocGenerator.getBuffer((buffer) => {
            // Define cabeçalhos
            res.writeHead(200, {
                'Content-Type': 'application/pdf',
                'Content-Disposition': 'attachment; filename="narrativa.pdf"',
                'Content-Length': buffer.length,
            });
            // Envia binário
            res.end(buffer);
        });
    }
    catch (error) {
        console.error('Erro ao gerar o PDF:', error);
        res.status(500).send('Erro ao gerar o PDF.');
    }
});
exports.default = { index, story_gen, form1, form2, quickForm, generatePDF };
