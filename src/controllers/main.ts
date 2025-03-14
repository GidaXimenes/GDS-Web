import { Request, Response } from 'express';
import callGeminiAPI from '../services/geminiService';
import prompts from '../prompts/prompt';
import { marked } from 'marked';
// pdfmake
import pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import htmlToPdfMake from 'html-to-pdfmake';
import { JSDOM } from 'jsdom';

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
      { text: 'Início', link: 'https://jrsbernardo.wixstudio.com/gdsweb' },
      { text: 'História Gerada' }, // ativo
    ];

    req.session.save((err) => {
      if (err) console.error('Erro ao salvar sessão:', err);
      res.render('main/story', {
        data,
        narrative: narrativeHTML,
        instructions: slideInstructionsHTML,
        breadcrumbs,
      });
    });
  } catch (error) {
    console.error('Erro ao gerar a narrativa:', error);
    res
      .status(500)
      .send(
        'Erro ao gerar a narrativa. O modelo do Gemini está sobrecarregado =(, tente novamante em alguns instantes',
      );
  }
};

const form1 = async (req: Request, res: Response): Promise<void> => {
  if (req.method === 'GET') {
    // BREADCRUMB p/ form1
    const breadcrumbs = [
      { text: 'Início', link: 'https://jrsbernardo.wixstudio.com/gdsweb' },
      { text: 'Formulário Completo' }, // ativo
    ];
    res.render('forms/completeForm1', { breadcrumbs });
  } else {
    try {
      const session = req.session as any;
      session.form1 = req.body;
      session.form2Data = [];
      session.remainingMissions = parseInt(req.body.quantidadeMissoes, 10);
      req.session.save((err) => {
        if (err) console.error('Erro ao salvar sessão:', err);
        res.redirect('/forms/completeForm2');
      });
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
        { text: 'Início', link: 'https://jrsbernardo.wixstudio.com/gdsweb' },
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

      req.session.save((err) => {
        if (err) console.error('Erro ao salvar sessão:', err);

        if (session.remainingMissions > 0) {
          res.redirect('/forms/completeForm2');
        } else {
          session.form2 = session.form2Data;
          res.redirect('/main/story');
        }
      });
    } catch (err) {
      res.status(500).send(err);
    }
  }
};

const quickForm = async (req: Request, res: Response): Promise<void> => {
  if (req.method === 'GET') {
    // BREADCRUMB p/ quickForm
    const breadcrumbs = [
      { text: 'Início', link: 'https://jrsbernardo.wixstudio.com/gdsweb' },
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
    //console.log('Sessão antes da geração do PDF:', session);

    if (!session.narrative || !session.instructions) {
      res.status(400).send('Dados para gerar o PDF estão incompletos.');
      return;
    }

    const { narrative, instructions } = session;

    // Resolver o Markdown corretamente
    const narrativeHTML = await marked.parse(narrative);
    const instructionsHTML = await marked.parse(instructions);

    // Criar um ambiente DOM simulado
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    const window = dom.window;

    // Converter HTML para pdfMake
    const narrativePdfMake = htmlToPdfMake(narrativeHTML, { window });
    const instructionsPdfMake = htmlToPdfMake(instructionsHTML, { window });

    // Definição do PDF
    const docDefinition: any = {
      pageSize: 'A4',
      pageMargins: [40, 60, 40, 60],
      content: [
        { text: 'Narrativa', style: 'header' },
        narrativePdfMake,
        {
          text: 'Instruções para criação do material',
          style: 'subheader',
          margin: [0, 20, 0, 10],
        },
        instructionsPdfMake,
      ],
      styles: {
        header: {
          fontSize: 18,
          bold: true,
          alignment: 'center',
          margin: [0, 0, 0, 10],
        },
        subheader: { fontSize: 14, bold: true, margin: [0, 10, 0, 10] },
      },
    };

    // Gerar e enviar o PDF
    const pdfDocGenerator = (pdfMake as any).createPdf(docDefinition);
    pdfDocGenerator.getBuffer((buffer: Buffer) => {
      res.writeHead(200, {
        'Content-Type': 'application/pdf',
        'Content-Disposition':
          'attachment; filename="narrativa_gamificada.pdf"',
        'Content-Length': buffer.length,
      });
      res.end(buffer);
    });
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    // É importante garantir que o catch não tente enviar outra resposta se já tiver sido enviada
    if (!res.headersSent) {
      res.status(500).send('Erro ao gerar PDF.');
    }
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
