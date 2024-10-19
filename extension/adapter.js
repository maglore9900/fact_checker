// Adapter.js: Converted from Python to JavaScript

import dotenv from 'dotenv';
import { OpenAI, ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import { ChatOllama } from "@langchain/ollama";
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import { ChatPromptTemplate } from '@langchain/core/prompts';


dotenv.config();

class Adapter {
  constructor(env) {
    if (!env || !env.LLM_TYPE) {
      throw new Error('LLM_TYPE is not defined in the environment variables');
    }
    this.llmText = env.LLM_TYPE.toLowerCase();

    if (this.llmText === 'openai') {
      this.llm = new OpenAI({
        temperature: 0,
        openAIApiKey: env.OPENAI_API_KEY
      });
      this.prompt = ChatPromptTemplate.fromTemplate('answer the following request: {topic}');
      this.llmChat = new ChatOpenAI({
        temperature: 0.3,
        model: env.OPENAI_MODEL,
        openAIApiKey: env.OPENAI_API_KEY
      });
      this.embedding = new OpenAIEmbeddings({
        model: 'text-embedding-ada-002'
      });
    } else if (this.llmText === 'local') {
      if (!env.OLLAMA_MODEL || !env.OLLAMA_URL) {
        throw new Error('OLLAMA_MODEL and OLLAMA_URL must be defined for local LLM');
      }
      const llmModel = env.OLLAMA_MODEL;
      this.llm = new Ollama({
        baseUrl: env.OLLAMA_URL,
        model: llmModel
      });
      this.prompt = ChatPromptTemplate.fromTemplate('answer the following request: {topic}');
      this.llmChat = new ChatOllama({
        baseUrl: env.OLLAMA_URL,
        model: llmModel
      });
      this.embedding = new HuggingFaceBgeEmbeddings({
        modelName: 'BAAI/bge-small-en',
        modelKwargs: { device: 'cpu' },
        encodeKwargs: { normalizeEmbeddings: true }
      });
    } else if (this.llmText === 'hybrid') {
      this.llm = new OpenAI({
        temperature: 0,
        openAIApiKey: env.OPENAI_API_KEY
      });
      this.embedding = new HuggingFaceBgeEmbeddings({
        modelName: 'BAAI/bge-small-en',
        modelKwargs: { device: 'cpu' },
        encodeKwargs: { normalizeEmbeddings: true }
      });
    } else {
      throw new Error('Invalid LLM_TYPE specified in environment variables');
    }
  }

  async chat(query) {
    console.log(`Adapter query: ${query}`);
    const model = this.llmChat;
    const result = await model.invoke(query);
    return JSON.stringify(result.content);
  }
}

export default Adapter;