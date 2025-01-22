import { GoogleGenerativeAI } from '@google/generative-ai';

// Função para chamar a API Gemini e gerar uma narrativa
const callGeminiAPI = async (prompt: string): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error(
      'A chave de API não está configurada. Verifique o arquivo .env.',
    );
  }

  const genAI = new GoogleGenerativeAI(process.env.API_KEY);

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const result = await model.generateContentStream(prompt);

    // Agrega o texto gerado
    let narrative = '';
    for await (const chunk of result.stream) {
      narrative += chunk.text();
    }

    return narrative;
  } catch (error) {
    console.error('Erro na requisição para o Google Gemini:', error);
    throw new Error('Falha na geração da narrativa.');
  }
};

export default callGeminiAPI;
