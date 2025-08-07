import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as pdfParse from 'pdf-parse';
import * as dotenv from 'dotenv';
import { Topic } from '../entities/topic.entity';
import { User } from '../entities/user.entity';
import { DashboardService } from '../services/dashboard.service';
import { CreditService } from '../services/credit.service';
import { ActionType } from '../entities/credit-transaction.entity';

dotenv.config();

@Injectable()
export class TopicService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(
    @InjectRepository(Topic)
    private topicRepository: Repository<Topic>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private dashboardService: DashboardService,
    private creditService: CreditService,
  ) {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  async createTopic(
    userId: number,
    name: string,
    buffer: Buffer,
  ): Promise<Topic> {
    try {
      // Enhanced validation for userId
      if (
        !userId ||
        typeof userId !== 'number' ||
        isNaN(userId) ||
        userId <= 0
      ) {
        console.error(
          'Invalid userId passed to createTopic:',
          userId,
          typeof userId,
        );
        throw new Error(`Invalid userId passed to createTopic: ${userId}`);
      }

      // Verify user exists in database
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        console.error('User not found in database for userId:', userId);
        throw new Error(`User not found for userId: ${userId}`);
      }

      // Check if user has enough credits for PDF upload
      const hasCredits = await this.creditService.consumeCredits(
        userId,
        ActionType.PDF_UPLOAD,
        `PDF upload: ${name}`,
      );

      if (!hasCredits) {
        throw new Error(
          'Insufficient credits for PDF upload. Please purchase more credits.',
        );
      }

      console.log('Creating topic for valid user:', userId);

      // Process the PDF
      const processed = await this.processPdf(buffer);
      const summary: string = processed.summary;
      const flashcards: any[] = processed.flashcards;
      const quizzes: any[] = processed.quizzes;

      // Create and save the topic
      const topic = this.topicRepository.create({
        name,
        summary: JSON.stringify(summary),
        flashcards: JSON.stringify(flashcards),
        quiz: JSON.stringify(quizzes),
        userId,
        hasSummary: true,
        hasFlashcards: true,
        hasQuiz: true,
      });

      const savedTopic = await this.topicRepository.save(topic);
      console.log(
        'Topic saved successfully:',
        savedTopic.id,
        'for userId:',
        userId,
      );

      // Double-check userId before recording study session
      if (!userId || typeof userId !== 'number' || isNaN(userId)) {
        console.error(
          'UserId became invalid before recording study session:',
          userId,
          typeof userId,
        );
        throw new Error(
          `UserId became invalid before recording study session: ${userId}`,
        );
      }

      console.log(
        'About to record study session for userId:',
        userId,
        'type:',
        typeof userId,
      );

      // Record the upload session in dashboard with enhanced error handling
      try {
        await this.dashboardService.recordStudySession(
          userId,
          'upload',
          name,
          0, // No duration for upload
          25, // Points for uploading a topic
          { topicId: savedTopic.id },
        );
        console.log('Study session recorded successfully for userId:', userId);
      } catch (sessionError) {
        console.error('Error recording study session:', sessionError);
        console.error('Session error details:', {
          userId,
          type: typeof userId,
          name,
          topicId: savedTopic.id,
        });
        // Don't throw here, just log the error
      }

      return savedTopic;
    } catch (error) {
      console.error('Error in createTopic:', error);
      throw error;
    }
  }

  async createTopicWithOptions(
    userId: number,
    name: string,
    buffer: Buffer,
    options: {
      generateSummary: boolean;
      generateFlashcards: boolean;
      generateQuiz: boolean;
    },
  ): Promise<Topic> {
    try {
      // Enhanced validation for userId
      if (
        !userId ||
        typeof userId !== 'number' ||
        isNaN(userId) ||
        userId <= 0
      ) {
        console.error(
          'Invalid userId passed to createTopicWithOptions:',
          userId,
          typeof userId,
        );
        throw new Error(
          `Invalid userId passed to createTopicWithOptions: ${userId}`,
        );
      }

      // Verify user exists in database
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        console.error('User not found in database for userId:', userId);
        throw new Error(`User not found for userId: ${userId}`);
      }

      // Calculate total credits needed
      let totalCredits = 0;
      if (options.generateSummary) totalCredits += 1; // SUMMARY_GENERATION costs 1 credit
      if (options.generateFlashcards) totalCredits += 1;
      if (options.generateQuiz) totalCredits += 1;

      // Check if user has enough credits
      if (totalCredits > 0) {
        const user = await this.userRepository.findOne({
          where: { id: userId },
        });
        if (!user) {
          throw new Error('User not found');
        }

        if (user.creditBalance < totalCredits) {
          throw new Error(
            `Insufficient credits. You have ${user.creditBalance} credits but need ${totalCredits} credits for the selected options. Please purchase more credits.`,
          );
        }

        // Consume credits for each selected option
        if (options.generateSummary) {
          const hasCredits = await this.creditService.consumeCredits(
            userId,
            ActionType.SUMMARY_GENERATION,
            `Summary generation for: ${name}`,
          );
          if (!hasCredits) {
            throw new Error('Failed to consume credits for summary generation');
          }
        }

        if (options.generateFlashcards) {
          const hasCredits = await this.creditService.consumeCredits(
            userId,
            ActionType.FLASHCARD_GENERATION,
            `Flashcard generation for: ${name}`,
          );
          if (!hasCredits) {
            throw new Error(
              'Failed to consume credits for flashcard generation',
            );
          }
        }

        if (options.generateQuiz) {
          const hasCredits = await this.creditService.consumeCredits(
            userId,
            ActionType.QUIZ_GENERATION,
            `Quiz generation for: ${name}`,
          );
          if (!hasCredits) {
            throw new Error('Failed to consume credits for quiz generation');
          }
        }
      }

      console.log(
        'Creating topic with options for valid user:',
        userId,
        'options:',
        options,
      );

      // Extract text from PDF
      const text = await this.extractTextFromPdf(buffer);

      // Generate content based on options
      let summary = '';
      let flashcards: any[] = [];
      let quizzes: any[] = [];

      if (options.generateSummary) {
        summary = await this.generateSummary(text);
      }

      if (options.generateFlashcards) {
        flashcards = await this.generateFlashcards(text);
      }

      if (options.generateQuiz) {
        quizzes = await this.generateQuizzes(text);
      }

      // Create and save the topic
      const topic = new Topic();
      topic.name = name;
      topic.summary = summary ? JSON.stringify(summary) : '';
      topic.flashcards =
        flashcards.length > 0 ? JSON.stringify(flashcards) : '';
      topic.quiz = quizzes.length > 0 ? JSON.stringify(quizzes) : '';
      topic.userId = userId;

      // Set generation flags
      topic.hasSummary = options.generateSummary;
      topic.hasFlashcards = options.generateFlashcards;
      topic.hasQuiz = options.generateQuiz;

      const savedTopic = await this.topicRepository.save(topic);
      console.log(
        'Topic saved successfully with options:',
        savedTopic.id,
        'for userId:',
        userId,
      );

      // Record the upload session in dashboard
      try {
        await this.dashboardService.recordStudySession(
          userId,
          'upload',
          name,
          0, // No duration for upload
          25, // Points for uploading a topic
          { topicId: savedTopic.id },
        );
        console.log('Study session recorded successfully for userId:', userId);
      } catch (sessionError) {
        console.error('Error recording study session:', sessionError);
      }

      return savedTopic;
    } catch (error) {
      console.error('Error in createTopicWithOptions:', error);
      throw error;
    }
  }

  async getUserTopics(userId: number): Promise<Topic[]> {
    if (!userId || typeof userId !== 'number' || isNaN(userId)) {
      throw new Error(`Invalid userId for getUserTopics: ${userId}`);
    }

    return this.topicRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async getTopicById(userId: number, topicId: number): Promise<Topic | null> {
    if (!userId || typeof userId !== 'number' || isNaN(userId)) {
      throw new Error(`Invalid userId for getTopicById: ${userId}`);
    }

    if (!topicId || typeof topicId !== 'number' || isNaN(topicId)) {
      throw new Error(`Invalid topicId for getTopicById: ${topicId}`);
    }

    return this.topicRepository.findOne({
      where: { id: topicId, userId },
    });
  }

  async deleteTopic(userId: number, topicId: number): Promise<void> {
    if (!userId || typeof userId !== 'number' || isNaN(userId)) {
      throw new Error(`Invalid userId for deleteTopic: ${userId}`);
    }

    if (!topicId || typeof topicId !== 'number' || isNaN(topicId)) {
      throw new Error(`Invalid topicId for deleteTopic: ${topicId}`);
    }

    const topic = await this.topicRepository.findOne({
      where: { id: topicId, userId },
    });

    if (topic) {
      await this.topicRepository.remove(topic);
    }
  }

  async processPdf(
    buffer: Buffer,
  ): Promise<{ summary: string; flashcards: any[]; quizzes: any[] }> {
    try {
      // 1. Extract text from PDF
      const pdfData = (await pdfParse(buffer)) as { text: string };
      const text: string = pdfData.text;

      if (!text || text.trim().length === 0) {
        throw new Error('No text could be extracted from the PDF');
      }

      // 2. Generate summary
      const summary: string = await this.generateSummary(text);
      // 3. Generate flashcards
      const flashcards: any[] = await this.generateFlashcards(text);
      // 4. Generate quizzes
      const quizzes: any[] = await this.generateQuizzes(text);

      return { summary, flashcards, quizzes };
    } catch (error) {
      console.error('Error processing PDF:', error);
      throw new Error('Failed to process PDF. Please try again later.');
    }
  }

  private async extractTextFromPdf(buffer: Buffer): Promise<string> {
    try {
      const pdfParse = require('pdf-parse');
      const data = await pdfParse(buffer);
      return data.text;
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      throw new Error('Failed to extract text from PDF');
    }
  }

  private async generateSummary(text: string): Promise<string> {
    try {
      const prompt = `Create a comprehensive and detailed summary of the following document. You MUST structure your response exactly as shown below with proper markdown formatting:

## Main Topic/Subject
[Provide a clear, concise description of what this document is about]

## Key Concepts
- [List the main ideas, theories, or concepts discussed]
- [Each concept should be on a separate bullet point]
- [Be specific and detailed]

## Important Details
- [List specific facts, data, examples, or important information]
- [Include relevant numbers, dates, or technical details]
- [Each detail should be on a separate bullet point]

## Structure/Organization
[Explain how the information is organized or presented in the document]

## Key Takeaways
- [List the most important points the reader should remember]
- [Focus on actionable insights or critical information]
- [Each takeaway should be on a separate bullet point]

## Context
[Provide background information or context that helps understand the document]

IMPORTANT INSTRUCTIONS:
1. Use exactly the section headers shown above
2. Use bullet points (-) for lists in Key Concepts, Important Details, and Key Takeaways
3. Write 2-4 bullet points for each list section
4. Keep paragraphs concise but informative
5. Use proper markdown formatting throughout
6. Make the summary comprehensive and well-structured

Document content: ${text.substring(0, 3000)}`;

      const result = await (
        this.model as { generateContent: (prompt: string) => Promise<any> }
      ).generateContent(prompt);
      const response = await (result as { response: Promise<any> }).response;
      const textResult = await (
        response as { text: () => Promise<string> }
      ).text();
      return textResult.trim();
    } catch (error) {
      console.error('Gemini API error in generateSummary:', error);
      return 'Unable to generate detailed summary at this time. Please try again later.';
    }
  }

  private async generateFlashcards(text: string): Promise<any[]> {
    try {
      const prompt = `Create exactly 5 flashcards from the following document. Each flashcard should cover different important aspects of the content. Return ONLY a valid JSON array with this exact format, no other text or explanations:
[{"question":"What is the main concept?","answer":"The main concept is..."},{"question":"What are the key points?","answer":"The key points are..."}]

Make the questions comprehensive but keep the answers concise and to the point (1-2 sentences maximum). Cover:
- Main topics and concepts
- Important facts and data
- Key definitions
- Significant examples
- Critical insights

Document content: ${text.substring(0, 2000)}`;

      const result = await (
        this.model as { generateContent: (prompt: string) => Promise<any> }
      ).generateContent(prompt);
      const response = await (result as { response: Promise<any> }).response;
      const content = await (
        response as { text: () => Promise<string> }
      ).text();
      const trimmedContent = content.trim();

      console.log('Flashcards raw response:', trimmedContent);

      try {
        // Try to extract JSON from the response
        const jsonMatch = trimmedContent.match(/\[.*\]/s);
        if (jsonMatch) {
          const parsed: unknown = JSON.parse(jsonMatch[0]);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
        // Try direct parsing
        const parsedDirect: unknown = JSON.parse(trimmedContent);
        if (Array.isArray(parsedDirect) && parsedDirect.length > 0) {
          return parsedDirect;
        }
        throw new Error('Invalid JSON structure');
      } catch (parseError: unknown) {
        console.error('JSON parsing error for flashcards:', parseError);
        console.log('Failed to parse content:', trimmedContent);
        return [
          {
            question: 'What is the main topic discussed in this document?',
            answer: 'The main topic is discussed in the uploaded document.',
          },
          {
            question: 'What are the key concepts and ideas presented?',
            answer: 'The key concepts are outlined in the document content.',
          },
        ];
      }
    } catch (error) {
      console.error('Gemini API error in generateFlashcards:', error);
      return [
        {
          question: 'Flashcard generation is temporarily unavailable',
          answer: 'Please try again later or contact support for assistance.',
        },
      ];
    }
  }

  private async generateQuizzes(text: string): Promise<any[]> {
    try {
      // Generate all three difficulty levels
      const beginnerQuizzes = await this.generateDifficultyQuizzes(
        text,
        'beginner',
      );
      const intermediateQuizzes = await this.generateDifficultyQuizzes(
        text,
        'intermediate',
      );
      const advancedQuizzes = await this.generateDifficultyQuizzes(
        text,
        'advanced',
      );

      // Combine and structure quizzes with difficulty levels
      const allQuizzes = [
        ...beginnerQuizzes.map((quiz) => ({ ...quiz, difficulty: 'beginner' })),
        ...intermediateQuizzes.map((quiz) => ({
          ...quiz,
          difficulty: 'intermediate',
        })),
        ...advancedQuizzes.map((quiz) => ({ ...quiz, difficulty: 'advanced' })),
      ];

      return allQuizzes;
    } catch (error) {
      console.error('Gemini API error in generateQuizzes:', error);
      return [
        {
          question: 'Quiz generation is temporarily unavailable',
          options: [
            'Please try again',
            'Contact support',
            'Check connection',
            'None of the above',
          ],
          answer: 'Please try again',
          difficulty: 'beginner',
        },
      ];
    }
  }

  private async generateDifficultyQuizzes(
    text: string,
    difficulty: 'beginner' | 'intermediate' | 'advanced',
  ): Promise<any[]> {
    try {
      const difficultyConfig = {
        beginner: {
          count: 4,
          instructions:
            'Create 4 beginner-level questions that test basic understanding and recall. Use simple language and focus on fundamental concepts, definitions, and basic facts.',
          focus: 'Focus on basic facts, definitions, and simple concepts',
        },
        intermediate: {
          count: 4,
          instructions:
            'Create 4 intermediate-level questions that test comprehension and application. Use moderate complexity and focus on understanding relationships, processes, and practical applications.',
          focus: 'Focus on comprehension, application, and moderate complexity',
        },
        advanced: {
          count: 2,
          instructions:
            'Create 2 advanced-level questions that test deep understanding, analysis, and synthesis. Use complex scenarios, require critical thinking, and test higher-order thinking skills.',
          focus: 'Focus on analysis, synthesis, and complex applications',
        },
      };

      const config = difficultyConfig[difficulty];

      const prompt = `Create exactly ${config.count} ${difficulty}-level multiple-choice quiz questions from the following document. 

${config.instructions}

IMPORTANT: Return ONLY a valid JSON array with this exact format, no other text or explanations:
[{"question":"What is the primary focus?","options":["Option A","Option B","Option C","Option D"],"answer":"Option A"}]

CRITICAL REQUIREMENTS:
1. Each question must have exactly 4 options
2. Options must be separate strings in an array, NOT concatenated
3. Each option should be a complete, standalone answer
4. The answer field must match exactly one of the options
5. Use clear, distinct options that are all plausible
6. ${config.focus}

Document content: ${text.substring(0, 2000)}`;

      const result = await (
        this.model as { generateContent: (prompt: string) => Promise<any> }
      ).generateContent(prompt);
      const response = await (result as { response: Promise<any> }).response;
      const content = await (
        response as { text: () => Promise<string> }
      ).text();
      const trimmedContent = content.trim();

      console.log(`${difficulty} Quizzes raw response:`, trimmedContent);

      try {
        // Try to extract JSON from the response
        const jsonMatch = trimmedContent.match(/\[.*\]/s);
        if (jsonMatch) {
          const parsed: unknown = JSON.parse(jsonMatch[0]);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Fix any questions where options is a single string
            return parsed.map((question: any) => {
              if (
                question.options &&
                Array.isArray(question.options) &&
                question.options.length === 1 &&
                typeof question.options[0] === 'string'
              ) {
                const optionsString = question.options[0];
                if (optionsString.includes(';')) {
                  question.options = optionsString
                    .split(';')
                    .map((opt: string) => opt.trim());
                }
              }
              return question;
            });
          }
        }
        // Try direct parsing
        const parsedDirect: unknown = JSON.parse(trimmedContent);
        if (Array.isArray(parsedDirect) && parsedDirect.length > 0) {
          // Fix any questions where options is a single string
          return parsedDirect.map((question: unknown) => {
            if (
              isQuizQuestionWithOptions(question) &&
              question.options.length === 1 &&
              typeof question.options[0] === 'string'
            ) {
              const optionsString: string = question.options[0] as string;
              if (optionsString.includes(';')) {
                question.options = optionsString
                  .split(';')
                  .map((opt: string) => opt.trim());
              }
            }
            return question;
          }) as any[];
        }
        throw new Error('Invalid JSON structure');
      } catch (parseError: unknown) {
        console.error(
          `JSON parsing error for ${difficulty} quizzes:`,
          parseError,
        );
        console.log('Failed to parse content:', trimmedContent);
        return [
          {
            question: `What is the main topic of this document? (${difficulty} level)`,
            options: ['Topic A', 'Topic B', 'Topic C', 'Topic D'],
            answer: 'Topic A',
          },
        ];
      }
    } catch (error) {
      console.error(`Gemini API error in generate${difficulty}Quizzes:`, error);
      return [
        {
          question: `${difficulty} quiz generation is temporarily unavailable`,
          options: [
            'Please try again',
            'Contact support',
            'Check connection',
            'None of the above',
          ],
          answer: 'Please try again',
        },
      ];
    }
  }

  // Helper method to debug UserStats issues
  async debugUserStats(userId: number): Promise<any> {
    try {
      console.log('=== DEBUG USER STATS ===');
      console.log('Input userId:', userId, 'Type:', typeof userId);

      const user = await this.userRepository.findOne({ where: { id: userId } });
      console.log(
        'User found:',
        !!user,
        user ? user.email || user.firstName + ' ' + user.lastName : 'No user',
      );

      const userStats = await this.dashboardService.getUserStats(userId);
      console.log('UserStats:', userStats ? userStats.id : 'No UserStats');

      return {
        userId,
        userIdType: typeof userId,
        userExists: !!user,
        userStatsExists: !!userStats,
        userStatsId: userStats?.id,
      };
    } catch (error) {
      console.error('Debug error:', error);
      return { error: error.message };
    }
  }
}

// Add a type guard for quiz question
function isQuizQuestionWithOptions(q: unknown): q is { options: unknown[] } {
  return (
    typeof q === 'object' &&
    q !== null &&
    'options' in q &&
    Array.isArray((q as any).options)
  );
}
