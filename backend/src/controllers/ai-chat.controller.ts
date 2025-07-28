import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';

dotenv.config();

interface ChatRequest {
  message: string;
  context?: {
    topic?: string;
    panel?: string;
    currentContent?: string;
  };
}

@Controller('ai')
export class AiChatController {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  @Post('chat')
  @UseGuards(JwtAuthGuard)
  async chat(@Body() chatRequest: ChatRequest, @Request() req: any) {
    try {
      const { message, context } = chatRequest;

      // Create a context-aware prompt
      const prompt = this.buildPrompt(message, context);

      // Generate response using Gemini AI
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return { response: text };
    } catch (error) {
      console.error('AI Chat Error:', error);
      return {
        response:
          "I'm sorry, I'm having trouble processing your request right now. Please try again in a moment.",
      };
    }
  }

  private buildPrompt(message: string, context?: any): string {
    const basePrompt = `You are an AI Study Assistant for InceptIQ, an intelligent learning platform. Your role is to help students learn more effectively by:

1. **Providing clear explanations** of concepts from their study materials
2. **Offering study strategies** and learning techniques
3. **Creating practice questions** based on their content
4. **Giving personalized study tips** and advice
5. **Helping with problem-solving** and concept clarification

**Current Context:**
- Topic: ${context?.topic || 'Not specified'}
- Current Panel: ${context?.panel || 'Not specified'}
- Content: ${context?.currentContent ? context.currentContent.substring(0, 200) + '...' : 'Not provided'}

**User Message:** ${message}

**Instructions:**
- Be encouraging and supportive
- Provide practical, actionable advice
- Use clear, simple language
- Include specific examples when helpful
- Suggest study techniques when appropriate
- Keep responses concise but informative
- If the user asks about specific content, reference it appropriately
- If they need help with study strategies, provide concrete steps

**Response Format:**
- Use markdown formatting for better readability
- Use bullet points for lists
- Highlight important concepts with **bold**
- Keep responses under 300 words unless more detail is specifically requested

Please provide a helpful, educational response:`;

    return basePrompt;
  }

  @Post('study-tips')
  @UseGuards(JwtAuthGuard)
  async getStudyTips(@Body() request: { topic: string; content?: string }) {
    try {
      const prompt = `As an AI Study Assistant, provide 3-5 specific study tips for the topic "${request.topic}". 

Consider the following when creating tips:
- Active learning techniques
- Memory retention strategies
- Time management advice
- Practice methods
- Review strategies

Format the response as a numbered list with clear, actionable tips. Keep each tip concise but practical.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return { tips: text };
    } catch (error) {
      console.error('Study Tips Error:', error);
      return {
        tips: 'Here are some general study tips:\n\n1. **Active Recall**: Test yourself instead of just re-reading\n2. **Spaced Repetition**: Review material at increasing intervals\n3. **Break Down Complex Topics**: Divide large concepts into smaller parts\n4. **Practice Application**: Use what you learn in real scenarios\n5. **Regular Review**: Schedule consistent study sessions',
      };
    }
  }

  @Post('explain-concept')
  @UseGuards(JwtAuthGuard)
  async explainConcept(@Body() request: { concept: string; context?: string }) {
    try {
      const prompt = `Explain the concept "${request.concept}" in a clear, educational way.

Context: ${request.context || 'General explanation requested'}

Provide:
1. A simple definition
2. Key points to remember
3. A practical example
4. Related concepts (if applicable)

Use clear language and structure the explanation logically.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return { explanation: text };
    } catch (error) {
      console.error('Concept Explanation Error:', error);
      return {
        explanation:
          "I'm sorry, I'm having trouble explaining that concept right now. Please try rephrasing your question or ask about a different aspect of the topic.",
      };
    }
  }

  @Post('practice-question')
  @UseGuards(JwtAuthGuard)
  async generatePracticeQuestion(
    @Body() request: { topic: string; content?: string },
  ) {
    try {
      const prompt = `Create a practice question for the topic "${request.topic}".

Content context: ${request.content ? request.content.substring(0, 300) + '...' : 'General topic'}

Generate:
1. A clear, relevant question
2. 4 multiple choice options (A, B, C, D)
3. The correct answer
4. A brief explanation of why it's correct

Make the question challenging but fair, and ensure it tests understanding rather than just memorization.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return { question: text };
    } catch (error) {
      console.error('Practice Question Error:', error);
      return {
        question:
          "I'm sorry, I'm having trouble generating a practice question right now. Please try asking about a specific concept or topic area.",
      };
    }
  }
}
