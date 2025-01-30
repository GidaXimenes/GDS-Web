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
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const removeCustomOption = (response) => {
    if (Array.isArray(response)) {
        return response.filter((item) => item !== 'Outro').join(', ');
    }
    return response;
};
const completePrompt = (form1Data, form2Data) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const nivelEnsino = removeCustomOption(form1Data.nivelEnsino || 'N/A');
        const temasGenerosNarrativos = removeCustomOption(form1Data.temasGenerosNarrativos || 'N/A');
        const personalizacao = removeCustomOption(form1Data.personalizacao || 'N/A');
        let prompt = `
Crie uma narrativa com gamificação baseada nas seguintes informações coletadas e as adapte na estrutura da narrativa logo abaixo:

- O nível dos participantes desta gamificação: ${nivelEnsino}
- Quantidade de pessoas que participarão: ${form1Data.quantidadePessoas || 'N/A'}
- Formato da aplicação: ${form1Data.formatoAplicacao || 'N/A'}
- Tema ou assunto a ser gamificado: ${form1Data.temaGamificacao || 'N/A'}
- Organização dos participantes: ${form1Data.interacao || 'N/A'}
- Tipo de interação principal: ${form1Data.tipoInteracao || 'N/A'}
- Personalização na gamificação: ${personalizacao}
- Quantidade de missões: ${form1Data.quantidadeMissoes || 'N/A'}
- Temas ou gêneros narrativos: ${temasGenerosNarrativos}

Sobre as missões:
`;
        form2Data.forEach((mission, index) => {
            const tipoAvaliacao = removeCustomOption(mission.tipoAvaliacao || 'N/A');
            const avaliacaoDesempenho = removeCustomOption(mission.avaliacaoDesempenho || 'N/A');
            const obstaculosMissao = removeCustomOption(mission.obstaculosMissao || 'N/A');
            const feedbackParticipantes = removeCustomOption(mission.feedbackParticipantes || 'N/A');
            const recompensas = removeCustomOption(mission.recompensas || 'N/A');
            const naoCompletarMissao = removeCustomOption(mission.naoCompletarMissao || 'N/A');
            prompt += `
Missão ${index + 1}:
- Conteúdo aprendido: ${mission.conteudoMissao || 'N/A'}
- Tipo de avaliação: ${tipoAvaliacao}
- Avaliação do desempenho: ${avaliacaoDesempenho}
- Obstáculos na missão: ${obstaculosMissao}
- Tipo de feedback: ${feedbackParticipantes}
- Tipo de recompensas: ${recompensas}
- Consequência em caso de missão não concluída: ${naoCompletarMissao}
`;
        });
        const basePrompt = yield promises_1.default.readFile(path_1.default.join(__dirname, 'completePrompt.txt'), 'utf-8');
        return `${prompt}\n${basePrompt.trim()}`;
    }
    catch (error) {
        console.error('Erro ao carregar o texto base para o prompt completo:', error);
        throw new Error('Falha ao gerar o prompt completo.');
    }
});
const quickPrompt = (quickFormData) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const temasGenerosNarrativos = removeCustomOption(quickFormData.temasGenerosNarrativos || 'N/A');
        const tipoAvaliacao = removeCustomOption(quickFormData.tipoAvaliacao || 'N/A');
        const obstaculosMissao = removeCustomOption(quickFormData.obstaculosMissao || 'N/A');
        let prompt = `
    Crie uma narrativa com gamificação baseada nas seguintes informações coletadas e as adapte na estrutura da narrativa logo abaixo:
    
    - Formato da aplicação: ${quickFormData.formatoAplicacao || 'N/A'}
    - Tema ou assunto a ser gamificado: ${quickFormData.temaGamificacao || 'N/A'}
    - Organização dos participantes: ${quickFormData.interacao || 'N/A'}
    - Tipo de interação principal: ${quickFormData.tipoInteracao || 'N/A'}
    - Temas ou gêneros narrativos: ${temasGenerosNarrativos}
    
    Sobre a missão:

    - Tipo de avaliação: ${tipoAvaliacao}
    - Obstáculos na missão: ${obstaculosMissao}
    `;
        const basePrompt = yield promises_1.default.readFile(path_1.default.join(__dirname, 'completePrompt.txt'), 'utf-8');
        return `${prompt}\n${basePrompt.trim()}`;
    }
    catch (error) {
        console.error('Erro ao carregar o texto base para o prompt rápido:', error);
        throw new Error('Falha ao gerar o prompt rápido.');
    }
});
const slidePrompt = (narrative) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let prompt = `Receba o seguinte texto de uma narrativa gamificada para uso educacional:
    \n${narrative}\n`;
        const basePrompt = yield promises_1.default.readFile(path_1.default.join(__dirname, 'completePrompt.txt'), 'utf-8');
        return `${prompt}\n${basePrompt.trim()}`;
    }
    catch (error) {
        console.error('Erro ao carregar o texto base para o prompt:', error);
        throw new Error('Falha ao gerar o prompt.');
    }
});
exports.default = { completePrompt, quickPrompt, slidePrompt };
