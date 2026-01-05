// src/background/llm-client.ts

import type { LLMResponse } from '@/types/messages';
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
