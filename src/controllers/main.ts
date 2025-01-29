import { Request, Response } from 'express';
import callGeminiAPI from '../services/geminiService';
import prompts from '../prompts/prompt';
import { marked } from 'marked';
// Import normal do pdfmake
import pdfMake from 'pdfmake/build/pdfmake';
// Import do vfs_fonts como "qualquer coisa"
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
//console.log('pdfFonts ->', pdfFonts);

// Basta usar a "default" diretamente como vfs
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
        .send(
          'Formulários incompletos. Por favor, preencha os formulários primeiro.',
        );
      return;
    }

    let prompt: string = '';
    let data: any;

    if (session.quickForm) {
      // Caso o usuário tenha escolhido a versão rápida
      prompt = await prompts.quickPrompt(session.quickForm);
      data = session.quickForm;
    } else if (session.form1 && session.form2) {
      // Caso o usuário tenha escolhido a versão completa
      prompt = await prompts.completePrompt(session.form1, session.form2);
      data = { form1: session.form1, form2: session.form2 };
    } else {
      res.status(400).send('Dados incompletos para gerar a narrativa.');
      return;
    }

    // Chame a API Gemini para gerar a narrativa
    const narrativeMarkdown = await callGeminiAPI(prompt);

    // Converta o Markdown para HTML
    const narrativeHTML = marked(narrativeMarkdown);

    // Gere o prompt para as instruções do slide
    const slidePrompt = await prompts.slidePrompt(narrativeMarkdown);

    // Chame a API Gemini novamente para gerar as instruções
    const slideInstructionsMarkdown = await callGeminiAPI(slidePrompt);

    // Converta as instruções de Markdown para HTML
    const slideInstructionsHTML = marked(slideInstructionsMarkdown);

    // Salve a narrativa e as instruções na sessão
    session.narrative = narrativeMarkdown; // Salve em Markdown para o PDF
    session.instructions = slideInstructionsMarkdown; // Salve em Markdown para o PDF

    // Renderize o story.handlebars com a narrativa e as instruções
    res.render('main/story', {
      data,
      narrative: narrativeHTML,
      instructions: slideInstructionsHTML,
    });
  } catch (error) {
    console.error('Erro ao gerar a narrativa ou as instruções:', error);
    res.status(500).send('Erro ao gerar a narrativa ou as instruções.');
  }
};

const form1 = async (req: Request, res: Response): Promise<void> => {
  if (req.method === 'GET') {
    res.render('forms/completeForm1');
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
      res.render('forms/completeForm2');
    } else {
      res.status(400).send('Quantidade de missões inválida');
    }
  } else {
    try {
      const session = req.session as any;
      session.form2Data.push(req.body);
      session.remainingMissions -= 1;

      if (session.remainingMissions > 0) {
        res.redirect('/forms/completeForm2');
      } else {
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
    res.render('forms/quickForm');
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

    // Montamos o docDefinition sem nos preocuparmos com a tipagem exata:
    const docDefinition: any = {
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
    const pdfDocGenerator = (pdfMake as any).createPdf(docDefinition);

    // Retorna em buffer
    pdfDocGenerator.getBuffer((buffer: Buffer) => {
      // Define cabeçalhos
      res.writeHead(200, {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="narrativa.pdf"',
        'Content-Length': buffer.length,
      });
      // Envia binário
      res.end(buffer);
    });
  } catch (error) {
    console.error('Erro ao gerar o PDF:', error);
    res.status(500).send('Erro ao gerar o PDF.');
  }
};

export default { index, story_gen, form1, form2, quickForm, generatePDF };
