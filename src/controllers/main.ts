import { Request, Response } from 'express';
import callGeminiAPI from '../services/geminiService';
import prompts from '../prompts/prompt';
import { marked } from 'marked';
// pdfmake
import pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';

(pdfMake as any).vfs = (pdfFonts as any).default;

const index = (req: Request, res: Response) => {
  res.render('main/index');
};

const story_gen = async (req: Request, res: Response): Promise<void> => {
  try {
    const session = req.session as any;

    if (!session.form1 && !session.quickForm) {
      res
        .status(400)
        .send('Formulários incompletos. Preencha os formulários primeiro.');
    }

    let prompt = '';
    let data: any;

    if (session.quickForm) {
      prompt = await prompts.quickPrompt(session.quickForm);
      data = session.quickForm;
    } else if (session.form1 && session.form2) {
      prompt = await prompts.completePrompt(session.form1, session.form2);
      data = { form1: session.form1, form2: session.form2 };
    } else {
      res.status(400).send('Dados incompletos para gerar a narrativa.');
    }

    // Chama a API
    const narrativeMarkdown = await callGeminiAPI(prompt);
    const narrativeHTML = marked(narrativeMarkdown);

    // Gera instruções
    const slidePrompt = await prompts.slidePrompt(narrativeMarkdown);
    const slideInstructionsMarkdown = await callGeminiAPI(slidePrompt);
    const slideInstructionsHTML = marked(slideInstructionsMarkdown);

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
};

const form1 = async (req: Request, res: Response): Promise<void> => {
  if (req.method === 'GET') {
    // BREADCRUMB p/ form1
    const breadcrumbs = [
      { text: 'Início', link: '/' },
      { text: 'Formulário Completo' }, // ativo
    ];
    res.render('forms/completeForm1', { breadcrumbs });
  } else {
    try {
      const session = req.session as any;
      session.form1 = req.body;
      session.form2Data = [];
      session.remainingMissions = parseInt(req.body.quantidadeMissoes, 10);
      res.redirect('/forms/completeForm2');
    } catch (err) {
      res.status(500).send(err);
    }
  }
};

const form2 = async (req: Request, res: Response): Promise<void> => {
  if (req.method === 'GET') {
    const session = req.session as any;

    if (session.remainingMissions > 0) {
      // BREADCRUMB p/ form2
      const breadcrumbs = [
        { text: 'Início', link: '/' },
        { text: 'Formulário Completo', link: '/forms/completeForm1' },
        { text: 'Missões' }, // ativo
      ];

      // Calcula total e missão atual
      const totalMissions = parseInt(
        session.form1?.quantidadeMissoes || '0',
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
      const session = req.session as any;
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
};

const quickForm = async (req: Request, res: Response): Promise<void> => {
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
      const session = req.session as any;
      session.quickForm = req.body;
      res.redirect('/main/story');
    } catch (err) {
      res.status(500).send(err);
    }
  }
};

const generatePDF = async (req: Request, res: Response): Promise<void> => {
  try {
    const session = req.session as any;
    if (!session.narrative || !session.instructions) {
      res.status(400).send('Dados para gerar o PDF estão incompletos.');
    }
    const { narrative, instructions } = session;

    const docDefinition: any = {
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

    const pdfDocGenerator = (pdfMake as any).createPdf(docDefinition);
    pdfDocGenerator.getBuffer((buffer: Buffer) => {
      res.writeHead(200, {
        'Content-Type': 'application/pdf',
        'Content-Disposition':
          'attachment; filename="narrativa gamificada.pdf"',
        'Content-Length': buffer.length,
      });
      res.end(buffer);
    });
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    res.status(500).send('Erro ao gerar PDF.');
  }
};

export default {
  index,
  story_gen,
  form1,
  form2,
  quickForm,
  generatePDF,
};
