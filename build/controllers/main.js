'use strict';
var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (
          !desc ||
          ('get' in desc ? !m.__esModule : desc.writable || desc.configurable)
        ) {
          desc = {
            enumerable: true,
            get: function () {
              return m[k];
            },
          };
        }
        Object.defineProperty(o, k2, desc);
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
      });
var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? function (o, v) {
        Object.defineProperty(o, 'default', { enumerable: true, value: v });
      }
    : function (o, v) {
        o['default'] = v;
      });
var __importStar =
  (this && this.__importStar) ||
  (function () {
    var ownKeys = function (o) {
      ownKeys =
        Object.getOwnPropertyNames ||
        function (o) {
          var ar = [];
          for (var k in o)
            if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
          return ar;
        };
      return ownKeys(o);
    };
    return function (mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null)
        for (var k = ownKeys(mod), i = 0; i < k.length; i++)
          if (k[i] !== 'default') __createBinding(result, mod, k[i]);
      __setModuleDefault(result, mod);
      return result;
    };
  })();
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator['throw'](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
const geminiService_1 = __importDefault(require('../services/geminiService'));
const prompt_1 = __importDefault(require('../prompts/prompt'));
const marked_1 = require('marked');
// pdfmake
const pdfmake_1 = __importDefault(require('pdfmake/build/pdfmake'));
const pdfFonts = __importStar(require('pdfmake/build/vfs_fonts'));
pdfmake_1.default.vfs = pdfFonts.default;
const index = (req, res) => {
  res.render('main/index');
};
const story_gen = (req, res) =>
  __awaiter(void 0, void 0, void 0, function* () {
    try {
      const session = req.session;
      if (!session.form1 && !session.quickForm) {
        res
          .status(400)
          .send('Formulários incompletos. Preencha os formulários primeiro.');
      }
      let prompt = '';
      let data;
      if (session.quickForm) {
        prompt = yield prompt_1.default.quickPrompt(session.quickForm);
        data = session.quickForm;
      } else if (session.form1 && session.form2) {
        prompt = yield prompt_1.default.completePrompt(
          session.form1,
          session.form2,
        );
        data = { form1: session.form1, form2: session.form2 };
      } else {
        res.status(400).send('Dados incompletos para gerar a narrativa.');
      }
      // Chama a API
      const narrativeMarkdown = yield (0, geminiService_1.default)(prompt);
      const narrativeHTML = (0, marked_1.marked)(narrativeMarkdown);
      // Gera instruções
      const slidePrompt = yield prompt_1.default.slidePrompt(narrativeMarkdown);
      const slideInstructionsMarkdown = yield (0, geminiService_1.default)(
        slidePrompt,
      );
      const slideInstructionsHTML = (0, marked_1.marked)(
        slideInstructionsMarkdown,
      );
      // Salva na sessão
      session.narrative = narrativeMarkdown;
      session.instructions = slideInstructionsMarkdown;
      // Monta breadcrumb para story
      const breadcrumbs = [
        { text: 'Início', link: '/' },
        { text: 'História Gerada' }, // ativo
      ];
      // Renderiza a view "story"
      res.render('main/story', {
        data,
        narrative: narrativeHTML,
        instructions: slideInstructionsHTML,
        breadcrumbs,
      });
    } catch (error) {
      console.error('Erro ao gerar a narrativa:', error);
      res.status(500).send('Erro ao gerar a narrativa.');
    }
  });
const form1 = (req, res) =>
  __awaiter(void 0, void 0, void 0, function* () {
    if (req.method === 'GET') {
      // BREADCRUMB p/ form1
      const breadcrumbs = [
        { text: 'Início', link: '/' },
        { text: 'Formulário Completo' }, // ativo
      ];
      res.render('forms/completeForm1', { breadcrumbs });
    } else {
      try {
        const session = req.session;
        session.form1 = req.body;
        session.form2Data = [];
        session.remainingMissions = parseInt(req.body.quantidadeMissoes, 10);
        res.redirect('/forms/completeForm2');
      } catch (err) {
        res.status(500).send(err);
      }
    }
  });
const form2 = (req, res) =>
  __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if (req.method === 'GET') {
      const session = req.session;
      if (session.remainingMissions > 0) {
        // BREADCRUMB p/ form2
        const breadcrumbs = [
          { text: 'Início', link: '/' },
          { text: 'Formulário Completo', link: '/forms/completeForm1' },
          { text: 'Missões' }, // ativo
        ];
        // Calcula total e missão atual
        const totalMissions = parseInt(
          ((_a = session.form1) === null || _a === void 0
            ? void 0
            : _a.quantidadeMissoes) || '0',
          10,
        );
        // Ex.: se o usuário pediu 3, no 1º GET de form2 => current= (3 -3 +1) =1
        // no 2º => (3 -2 +1)=2 etc.
        const currentMission = totalMissions - session.remainingMissions + 1;
        // Renderiza com as variáveis
        return res.render('forms/completeForm2', {
          breadcrumbs,
          totalMissions,
          currentMission,
          remainingMissions: session.remainingMissions,
        });
      } else {
        res.status(400).send('Quantidade de missões inválida');
      }
    } else {
      // POST => salva e decide se tem mais missões
      try {
        const session = req.session;
        session.form2Data.push(req.body);
        session.remainingMissions -= 1;
        if (session.remainingMissions > 0) {
          // ainda tem missões => repete
          res.redirect('/forms/completeForm2');
        } else {
          // terminou => story
          session.form2 = session.form2Data;
          res.redirect('/main/story');
        }
      } catch (err) {
        res.status(500).send(err);
      }
    }
  });
const quickForm = (req, res) =>
  __awaiter(void 0, void 0, void 0, function* () {
    if (req.method === 'GET') {
      // BREADCRUMB p/ quickForm
      const breadcrumbs = [
        { text: 'Início', link: '/' },
        { text: 'Formulário Rápido' }, // ativo
      ];
      return res.render('forms/quickForm', {
        breadcrumbs,
        bodyClass: 'quickform-body',
      });
    } else {
      try {
        const session = req.session;
        session.quickForm = req.body;
        res.redirect('/main/story');
      } catch (err) {
        res.status(500).send(err);
      }
    }
  });
const generatePDF = (req, res) =>
  __awaiter(void 0, void 0, void 0, function* () {
    try {
      const session = req.session;
      if (!session.narrative || !session.instructions) {
        res.status(400).send('Dados para gerar o PDF estão incompletos.');
      }
      const { narrative, instructions } = session;
      const docDefinition = {
        pageSize: 'A4',
        pageMargins: [40, 60, 40, 60],
        content: [
          { text: 'Minha Narrativa', style: 'header' },
          { text: narrative, margin: [0, 10, 0, 10] },
          { text: 'Minhas Instruções', style: 'subheader' },
          { text: instructions },
        ],
        styles: {
          header: { fontSize: 18, bold: true },
          subheader: { fontSize: 14, bold: true },
        },
      };
      const pdfDocGenerator = pdfmake_1.default.createPdf(docDefinition);
      pdfDocGenerator.getBuffer((buffer) => {
        res.writeHead(200, {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'attachment; filename="narrativa.pdf"',
          'Content-Length': buffer.length,
        });
        res.end(buffer);
      });
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      res.status(500).send('Erro ao gerar PDF.');
    }
  });
exports.default = {
  index,
  story_gen,
  form1,
  form2,
  quickForm,
  generatePDF,
};
