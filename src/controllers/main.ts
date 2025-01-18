import { Request, Response } from 'express';

const index = (req: Request, res: Response) => {
  res.end('Welcome to Web academy!');
};

const hb1 = (req: Request, res: Response) => {
  res.render('main/hb1', {
    mensagem: 'Olá, você está aprendendo Handlebars + Express',
  });
};

const hb2 = (req: Request, res: Response) => {
  res.render('main/hb2', {
    poweredByNodejs: true,
    name: 'Express',
    type: 'Framework',
  });
};

export default { index, hb1, hb2 };
