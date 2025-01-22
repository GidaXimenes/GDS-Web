import { Request, Response } from 'express';
import callGeminiAPI from '../services/geminiService';
import prompts from '../prompts/prompt';
import { marked } from 'marked';

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
      // Caso nenhum formulário tenha sido respondido
      res.status(400).send('Dados incompletos para gerar a narrativa.');
    }

    // Chame a API Gemini para gerar a narrativa
    const narrativeMarkdown = await callGeminiAPI(prompt);

    // Converta o Markdown para HTML
    const narrativeHTML = marked(narrativeMarkdown);

    // Renderize o story.handlebars com a narrativa gerada
    res.render('main/story', {
      data,
      narrative: narrativeHTML,
    });
  } catch (error) {
    console.error('Erro ao gerar a narrativa:', error);
    res.status(500).send('Erro ao gerar a narrativa.');
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

export default { index, story_gen, form1, form2, quickForm };
