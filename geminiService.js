import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

if (!process.env.GEMINI_API_KEY) {
    console.error('FATAL ERROR: GEMINI_API_KEY is not set in the environment variables.');
    process.exit(1);
}

export const generateFlashcards = async (text, count = 10) => {
    const prompt = `Generate exactly ${count} educational flashcards from the following text.
Format each flashcard as:
Q: [Clear, specific question]
A: [Concise, accurate answer]
D: [Difficulty level: easy, medium, or hard]
Separate each flashcard with "---"

Text:
${text.substring(0, 15000)}`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-lite",
            contents: prompt
        });
        
        const generatedText = response.text;
        const flashcards = [];
        const cards = generatedText.split('---').filter(c => c.trim());
        
        for (const card of cards) {
            const lines = card.trim().split('\n');
            let question = '', answer = '', difficulty = 'medium';
            
            for (const line of lines) {
                if (line.startsWith('Q:')) {
                    question = line.substring(2).trim();
                } else if (line.startsWith('A:')) {
                    answer = line.substring(2).trim();
                } else if (line.startsWith('D:')) {
                    const diff = line.substring(2).trim().toLowerCase();
                    if (['easy', 'medium', 'hard'].includes(diff)) {
                        difficulty = diff;
                    }
                }
            }
            
            if (question && answer) {
                flashcards.push({ question, answer, difficulty });
            }
        }
        
        return flashcards.slice(0, count);
    } catch (error) {
        console.error('Gemini API error (flashcards):', error);
        throw new Error('Failed to generate flashcards');
    }
};

export const generateQuiz = async (text, numQuestions = 5) => {
    const prompt = `Generate exactly ${numQuestions} multiple choice questions from the following text.
Format each question EXACTLY as:
Q: [The question text]
O1: [First option]
O2: [Second option]
O3: [Third option]
O4: [Fourth option]
C: [The exact text of the correct option from above]
E: [Brief explanation of why this is correct]
D: [Difficulty: easy, medium, or hard]
Separate each question with "---"

Important: 
- Each option (O1-O4) must be on its own line
- The correct answer (C) must match EXACTLY one of the options
- Do not add any extra text before or after the questions

Text:
${text.substring(0, 15000)}`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-lite",
            contents: prompt
        });
        
        const generatedText = response.text;
        
        // Debug: log the response
        console.log("=== Gemini Quiz Response ===");
        console.log(generatedText.substring(0, 500));
        console.log("============================");
        
        const questions = [];
        const questionBlocks = generatedText.split("---").filter(q => q.trim());
        
        console.log(`Found ${questionBlocks.length} question blocks`);
        
        for (const block of questionBlocks) {
            const lines = block.trim().split('\n');
            let question = '', options = [], correctAnswer = '', explanation = '', difficulty = 'medium';
            
            for (const line of lines) {
                const trimmed = line.trim();
                
                if (trimmed.startsWith('Q:')) {
                    question = trimmed.substring(2).trim();
                } else if (trimmed.match(/^O\d:/i)) {
                    // Extract option (remove O1:, O2:, etc.)
                    const optionText = trimmed.substring(3).trim();
                    if (optionText) {
                        options.push(optionText);
                    }
                } else if (trimmed.startsWith('C:')) {
                    correctAnswer = trimmed.substring(2).trim();
                } else if (trimmed.startsWith('E:')) {
                    explanation = trimmed.substring(2).trim();
                } else if (trimmed.startsWith('D:')) {
                    const diff = trimmed.substring(2).trim().toLowerCase();
                    if (['easy', 'medium', 'hard'].includes(diff)) {
                        difficulty = diff;
                    }
                }
            }
            
            // Validate the question has all required parts
            if (question && options.length === 4 && correctAnswer) {
                questions.push({ 
                    question, 
                    options, 
                    correctAnswer, 
                    explanation: explanation || "No explanation provided", 
                    difficulty 
                });
                console.log(`✅ Added question: "${question.substring(0, 50)}..."`);
            } else {
                console.log(`❌ Skipped question - Missing: question=${!!question}, options=${options.length}/4, correctAnswer=${!!correctAnswer}`);
            }
        }
        
        console.log(`✅ Successfully generated ${questions.length} out of ${numQuestions} questions`);
        
        return questions.slice(0, numQuestions);
    } catch (error) {
        console.error('Gemini API error (quiz):', error);
        throw new Error('Failed to generate quiz');
    }
};

export const generateSummary = async (text) => {
    const prompt = `Provide a concise summary of the following text, highlighting the key concepts, main ideas, and important points.

Text:
${text.substring(0, 20000)}`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-lite',
            contents: prompt
        });
        
        return response.text;
    } catch (error) {
        console.error('Gemini API error (summary):', error);
        throw new Error('Failed to generate summary');
    }
};

export const chatWithContext = async (question, chunks) => {
    const context = chunks.map((c, i) => `[Chunk ${i + 1}]\n${c.content}`).join('\n\n');
    
    const prompt = `Based on the following context from a document, answer the user's question.
If the answer is not in the context, say "I cannot find the answer to this question in the document."

Context:
${context}

Question: ${question}

Answer:`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-lite',
            contents: prompt
        });
        
        return response.text;
    } catch (error) {
        console.error('Gemini API error (chat):', error);
        throw new Error('Failed to process chat request');
    }
};

export const explainConcept = async (concept, context) => {
    const prompt = `Explain the concept of "${concept}" based on the following context.
Provide a clear, educational explanation that's easy to understand.
Include examples if relevant.

Context:
${context.substring(0, 10000)}`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-lite',
            contents: prompt
        });
        
        return response.text;
    } catch (error) {
        console.error('Gemini API error (explain concept):', error);
        throw new Error('Failed to explain concept');
    }
};