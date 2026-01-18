// src/background/llm-client.ts

import type { LLMResponse } from '@/types/messages';
import type { PracticeQuestion, QuestionType } from '@/types';
import { getSettings } from '@/lib/storage';

/**
 * LLM API客户端
 *
 * 支持任何OpenAI API兼容接口：
 * - OpenAI官方 (api.openai.com)
 * - Azure OpenAI (*.openai.azure.com)
 * - 国内大模型：智谱AI、百川智能、DeepSeek、Moonshot等
 *
 * 推荐模型：gpt-3.5-turbo-0125（性价比最优，响应快）
 */

export async function generateWordExplanation(
  word: string
): Promise<LLMResponse> {
  const settings = await getSettings();
  const { llm } = settings;

  if (!llm.apiKey) {
    throw new Error('请先在设置中配置LLM API Key');
  }

  const systemPrompt = `你是一个专业的英语词汇教学助手，专注于技术文档场景。请为给定单词生成结构化释义。`;

  const userPrompt = `
请为单词 "${word}" 生成以下内容，以JSON格式返回：

{
  "word": "单词原文（小写）",
  "phonetic": "英式音标（如 /ɪˈfem.ər.əl/）",
  "definitions": [
    {
      "pos": "词性（n./v./adj./adv.等）",
      "meaning": "中文释义（简洁，15字以内）"
    }
  ],
  "examples": [
    {
      "en": "英文例句（优先技术场景）",
      "zh": "中文翻译"
    }
  ],
  "etymology": "词根词缀解释。如无明确词根，返回空字符串。"
}

要求：
1. definitions数组包含所有常见词性和释义（最多3个）
2. examples数组包含2-3个例句，优先使用编程/技术相关例句
3. 释义简洁专业，避免冗长解释
4. 例句难度适中，贴近实际使用场景
`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), llm.timeout);

  try {
    const response = await fetch(llm.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${llm.apiKey}`,
      },
      body: JSON.stringify({
        model: llm.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: llm.temperature,
        response_format: { type: 'json_object' }, // 强制JSON输出（OpenAI兼容）
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || response.statusText);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    const parsed: LLMResponse = JSON.parse(content);

    // 验证响应格式
    if (!parsed.phonetic || !parsed.definitions || !parsed.examples) {
      throw new Error('响应格式错误：缺少必需字段');
    }

    return parsed;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error('请求超时（30s）');
    }
    throw error;
  }
}

/**
 * 测试LLM连接
 */
export async function testLLMConnection(): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    await generateWordExplanation('test');
    return { success: true, message: '✅ 连接成功！' };
  } catch (error: any) {
    return { success: false, message: `❌ ${error.message}` };
  }
}

// ==================== 练习题目生成 ====================

interface ChoiceQuestionResponse {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

interface FillQuestionResponse {
  question: string;
  blankAnswer: string;
  context: string;
  explanation: string;
}

/**
 * 生成练习题目
 */
export async function generatePracticeQuestion(
  word: string,
  wordData: {
    definitions: { pos: string; meaning: string }[];
    examples: { en: string; zh: string }[];
  },
  type: QuestionType
): Promise<PracticeQuestion> {
  const settings = await getSettings();
  const { llm } = settings;

  if (!llm.apiKey) {
    throw new Error('请先在设置中配置LLM API Key');
  }

  if (type === 'choice') {
    return generateChoiceQuestion(word, wordData, llm);
  } else {
    return generateFillQuestion(word, wordData, llm);
  }
}

/**
 * 生成选择题
 */
async function generateChoiceQuestion(
  word: string,
  wordData: {
    definitions: { pos: string; meaning: string }[];
    examples: { en: string; zh: string }[];
  },
  llm: { apiEndpoint: string; apiKey: string; model: string; temperature: number; timeout: number }
): Promise<PracticeQuestion> {
  const definitions = wordData.definitions.map(d => `${d.pos} ${d.meaning}`).join('; ');
  const examplesText = wordData.examples.map(e => `${e.en}（${e.zh}）`).join('\n');

  const systemPrompt = `你是一个英语词汇练习题生成器。请为给定单词生成高质量的选择题。`;

  const userPrompt = `
请为单词 "${word}" 生成一道选择题。

单词信息：
- 音标：${wordData.definitions[0]?.pos || ''}
- 释义：${definitions}
- 例句：
${examplesText}

要求：
1. 题干：给出单词的英文释义（使用较简单的词汇描述）
2. 选项：4个选项，1个正确，3个干扰项
3. 干扰项应该是同领域相关的错误释义，不要太明显
4. 返回严格JSON格式

返回格式：
{
  "question": "What does '${word}' mean?",
  "options": ["正确释义", "干扰项1", "干扰项2", "干扰项3"],
  "correctAnswer": "正确释义",
  "explanation": "单词 ${word} 表示..."
}
`;

  const response = await fetch(llm.apiEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${llm.apiKey}`,
    },
    body: JSON.stringify({
      model: llm.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.5,
      response_format: { type: 'json_object' },
    }),
  });

  const data = await response.json();
  const parsed: ChoiceQuestionResponse = JSON.parse(data.choices[0].message.content);

  return {
    id: `${word}-${Date.now()}`,
    word,
    type: 'choice',
    question: parsed.question,
    options: shuffleArray(parsed.options),
    correctAnswer: parsed.correctAnswer,
    explanation: parsed.explanation,
  };
}

/**
 * 生成填空题
 */
async function generateFillQuestion(
  word: string,
  wordData: {
    definitions: { pos: string; meaning: string }[];
    examples: { en: string; zh: string }[];
  },
  llm: { apiEndpoint: string; apiKey: string; model: string; temperature: number; timeout: number }
): Promise<PracticeQuestion> {
  // 优先使用例句生成填空
  const suitableExample = wordData.examples.find(e =>
    e.en.toLowerCase().includes(word.toLowerCase())
  );

  const definitions = wordData.definitions.map(d => `${d.pos} ${d.meaning}`).join('; ');

  let userPrompt: string;

  if (suitableExample) {
    userPrompt = `
请为单词 "${word}" 生成一道填空题。

单词信息：
- 释义：${definitions}
- 例句：${suitableExample.en}（${suitableExample.zh}）

要求：
1. 从例句中挖掉该单词生成填空题（用___表示填空）
2. 返回严格JSON格式

返回格式：
{
  "question": "The ___ is essential for learning.",
  "blankAnswer": "vocabulary",
  "context": "The vocabulary is essential for learning.",
  "explanation": "vocabulary 作为名词，表示'词汇'"
}
`;
  } else {
    userPrompt = `
请为单词 "${word}" 生成一道填空题。

单词信息：
- 释义：${definitions}

要求：
1. 根据单词含义和词性造一个简单的英文句子
2. 在句子的适当位置用___表示填空
3. 返回严格JSON格式

返回格式：
{
  "question": "This concept is ___ (lasting for a very short time).",
  "blankAnswer": "ephemeral",
  "context": "This concept is ephemeral.",
  "explanation": "ephemeral 作为形容词，表示'短暂的、转瞬即逝的'"
}
`;
  }

  const systemPrompt = `你是一个英语词汇练习题生成器。请根据例句生成填空题。`;

  const response = await fetch(llm.apiEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${llm.apiKey}`,
    },
    body: JSON.stringify({
      model: llm.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.5,
      response_format: { type: 'json_object' },
    }),
  });

  const data = await response.json();
  const parsed: FillQuestionResponse = JSON.parse(data.choices[0].message.content);

  return {
    id: `${word}-${Date.now()}`,
    word,
    type: 'fill',
    question: parsed.question,
    correctAnswer: parsed.blankAnswer.toLowerCase(),
    explanation: parsed.explanation,
  };
}

/**
 * 随机打乱数组（Fisher-Yates算法）
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
